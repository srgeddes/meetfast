import { loadExtensionConfig } from "./configLoader.js";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const TOKEN_STORAGE_KEY = "googleOAuthTokens";

let cachedTokens = null;
let activeAuthWindowId = null;
let configCache = null;

async function getConfig() {
	if (configCache) {
		return configCache;
	}
	const raw = await loadExtensionConfig();
	const callbackUrl = raw.GOOGLE_OAUTH_CALLBACK_URL.trim();
	let callbackUrlPrefix = callbackUrl;
	try {
		const parsed = new URL(callbackUrl);
		callbackUrlPrefix = `${parsed.origin}${parsed.pathname}`;
	} catch {
		// Fallback to raw value if URL parsing fails.
	}
	configCache = {
		...raw,
		CALLBACK_URL: callbackUrl,
		CALLBACK_URL_PREFIX: callbackUrlPrefix,
		CALENDAR_SCOPE_STRING: raw.GOOGLE_CALENDAR_SCOPES.join(" "),
	};
	return configCache;
}

function generateRandomState() {
	const buffer = new Uint8Array(16);
	crypto.getRandomValues(buffer);
	return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isTokenExpired(expiry, thresholdMs = 60_000) {
	if (!expiry) {
		return true;
	}
	return Date.now() >= expiry - thresholdMs;
}

function buildAuthUrl(state, config) {
	const url = new URL(GOOGLE_AUTH_ENDPOINT);
	url.searchParams.set("client_id", config.GOOGLE_OAUTH_CLIENT_ID);
	url.searchParams.set("redirect_uri", config.CALLBACK_URL);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("access_type", "offline");
	url.searchParams.set("prompt", "consent");
	url.searchParams.set("include_granted_scopes", "true");
	url.searchParams.set("scope", config.CALENDAR_SCOPE_STRING);
	url.searchParams.set("state", state);
	return url.toString();
}

function storageGet(key) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(key, (result) => {
			const lastError = chrome.runtime.lastError;
			if (lastError) {
				reject(new Error(lastError.message));
				return;
			}
			resolve(result);
		});
	});
}

function storageSet(values) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set(values, () => {
			const lastError = chrome.runtime.lastError;
			if (lastError) {
				reject(new Error(lastError.message));
				return;
			}
			resolve();
		});
	});
}

function storageRemove(key) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.remove(key, () => {
			const lastError = chrome.runtime.lastError;
			if (lastError) {
				reject(new Error(lastError.message));
				return;
			}
			resolve();
		});
	});
}

async function windowsCreate(options) {
	return new Promise((resolve, reject) => {
		chrome.windows.create(options, (createdWindow) => {
			const lastError = chrome.runtime.lastError;
			if (lastError) {
				reject(new Error(lastError.message));
				return;
			}
			resolve(createdWindow);
		});
	});
}

async function windowsRemove(windowId) {
	return new Promise((resolve) => {
		if (windowId === null || windowId === undefined) {
			resolve();
			return;
		}
		chrome.windows.remove(windowId, () => {
			// Ignore errors for already closed windows.
			resolve();
		});
	});
}

async function loadTokensFromStorage() {
	if (cachedTokens) {
		return cachedTokens;
	}
	const stored = await storageGet(TOKEN_STORAGE_KEY);
	const tokens = stored?.[TOKEN_STORAGE_KEY];
	if (tokens && typeof tokens === "object") {
		cachedTokens = tokens;
		return tokens;
	}
	return null;
}

async function persistTokens(tokens) {
	cachedTokens = tokens;
	await storageSet({ [TOKEN_STORAGE_KEY]: tokens });
}

async function clearStoredTokens() {
	cachedTokens = null;
	await storageRemove(TOKEN_STORAGE_KEY);
}

async function waitForAuthCode(state, { tabId, windowId }, config) {
	return new Promise((resolve, reject) => {
		let resolved = false;

		const timeoutId = setTimeout(() => {
			cleanup();
			reject(new Error("Timed out waiting for Google authentication to finish."));
		}, 5 * 60_000);

		function cleanup() {
			if (chrome.webNavigation.onBeforeNavigate.hasListener(handleNavigation)) {
				chrome.webNavigation.onBeforeNavigate.removeListener(handleNavigation);
			}
			if (chrome.windows.onRemoved.hasListener(handleWindowRemoved)) {
				chrome.windows.onRemoved.removeListener(handleWindowRemoved);
			}
			clearTimeout(timeoutId);
		}

		function handleNavigation(details) {
			if (typeof tabId === "number" && details.tabId !== tabId) {
				return;
			}
			if (!details.url.startsWith(config.CALLBACK_URL_PREFIX)) {
				return;
			}

			try {
				const redirectUrl = new URL(details.url);
				const returnedState = redirectUrl.searchParams.get("state");
				if (!returnedState || returnedState !== state) {
					throw new Error("State mismatch detected during Google authentication.");
				}
				const code = redirectUrl.searchParams.get("code");
				if (!code) {
					const errorParam = redirectUrl.searchParams.get("error") ?? "unknown_error";
					throw new Error(`Google authentication failed: ${errorParam}`);
				}
				resolved = true;
				cleanup();
				resolve({ code });
			} catch (error) {
				cleanup();
				reject(error instanceof Error ? error : new Error("Invalid redirect URL received from Google."));
			}
		}

		function handleWindowRemoved(removedWindowId) {
			if (windowId && removedWindowId === windowId && !resolved) {
				cleanup();
				reject(new Error("Sign-in window was closed before Google authentication completed."));
			}
		}

		chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation, {
			url: [{ urlPrefix: config.CALLBACK_URL_PREFIX }],
		});
		chrome.windows.onRemoved.addListener(handleWindowRemoved);
	});
}

async function exchangeCodeForTokens(code, config) {
	const body = new URLSearchParams({
		code,
		client_id: config.GOOGLE_OAUTH_CLIENT_ID,
		client_secret: config.GOOGLE_OAUTH_CLIENT_SECRET,
		redirect_uri: config.CALLBACK_URL,
		grant_type: "authorization_code",
	});

	const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});

	const payload = await response.json();
	if (!response.ok) {
		const message = payload?.error_description || payload?.error || "Unknown error";
		throw new Error(`Google token exchange failed: ${message}`);
	}

	const expiresInSeconds = Number(payload.expires_in ?? 0);
	return {
		accessToken: payload.access_token,
		refreshToken: payload.refresh_token ?? null,
		scope: payload.scope ?? config.CALENDAR_SCOPE_STRING,
		tokenType: payload.token_type ?? "Bearer",
		expiry: Date.now() + expiresInSeconds * 1000,
	};
}

async function refreshAccessToken(refreshToken, config) {
	const body = new URLSearchParams({
		refresh_token: refreshToken,
		client_id: config.GOOGLE_OAUTH_CLIENT_ID,
		client_secret: config.GOOGLE_OAUTH_CLIENT_SECRET,
		grant_type: "refresh_token",
	});

	const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});
	const payload = await response.json();

	if (!response.ok) {
		const message = payload?.error_description || payload?.error || "Unknown error";
		throw new Error(`Unable to refresh Google access token: ${message}`);
	}

	const expiresInSeconds = Number(payload.expires_in ?? 0);
	return {
		accessToken: payload.access_token,
		expiry: Date.now() + expiresInSeconds * 1000,
		scope: payload.scope,
		tokenType: payload.token_type ?? "Bearer",
		refreshToken,
	};
}

async function revokeToken(token) {
	if (!token) {
		return;
	}
	await fetch(`${GOOGLE_REVOKE_ENDPOINT}?token=${encodeURIComponent(token)}`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
	});
}

async function ensureFreshTokens({ interactive = false } = {}, configOverride) {
	const config = configOverride ?? (await getConfig());
	let tokens = await loadTokensFromStorage();
	if (!tokens) {
		if (!interactive) {
			throw new Error("No Google session is available. Sign in first.");
		}
		tokens = await authenticateInteractive(config);
		return tokens;
	}

	if (!isTokenExpired(tokens.expiry)) {
		return tokens;
	}

	if (!tokens.refreshToken) {
		if (!interactive) {
			throw new Error("Google session expired. Sign in again to continue.");
		}
		return authenticateInteractive(config);
	}

	const refreshed = await refreshAccessToken(tokens.refreshToken, config);
	const updatedTokens = {
		...tokens,
		...refreshed,
		refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
	};
	await persistTokens(updatedTokens);
	return updatedTokens;
}

export async function authenticateInteractive(configOverride) {
	const config = configOverride ?? (await getConfig());
	const state = generateRandomState();
	const authUrl = buildAuthUrl(state, config);

	const authWindow = await windowsCreate({
		url: authUrl,
		type: "popup",
		width: 512,
		height: 640,
	});

	activeAuthWindowId = authWindow?.id ?? null;
	const authTabId = authWindow?.tabs?.[0]?.id;

	try {
		const { code } = await waitForAuthCode(
			state,
			{
				tabId: authTabId,
				windowId: activeAuthWindowId,
			},
			config,
		);

		await windowsRemove(activeAuthWindowId);
		activeAuthWindowId = null;

		const tokens = await exchangeCodeForTokens(code, config);
		if (!tokens.refreshToken) {
			throw new Error("Google did not return a refresh token. Ensure 'prompt=consent' is honored.");
		}
		await persistTokens(tokens);
		return tokens;
	} catch (error) {
		await windowsRemove(activeAuthWindowId);
		activeAuthWindowId = null;
		throw error instanceof Error ? error : new Error("Google authentication failed.");
	}
}

export async function getAccessToken({ interactive = false } = {}) {
	const config = await getConfig();
	const tokens = await ensureFreshTokens({ interactive }, config);
	return tokens.accessToken;
}

export async function signOut() {
	const tokens = await loadTokensFromStorage();
	if (tokens?.accessToken) {
		await revokeToken(tokens.accessToken);
	}
	if (tokens?.refreshToken) {
		await revokeToken(tokens.refreshToken);
	}
	await clearStoredTokens();
	return { signedOut: true };
}

export async function ensureSession() {
	const config = await getConfig();
	return ensureFreshTokens({ interactive: false }, config);
}
