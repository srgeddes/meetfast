import { listCalendars, listEvents } from "../lib/googleApi.js";
import { authenticateInteractive, ensureSession, signOut } from "../lib/googleAuth.js";

function mapAuthError(error) {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		if (message.includes("no google session")) {
			return new Error('No Google account connected. Use "Sign in with Google" first.');
		}
		if (message.includes("sign in again")) {
			return new Error("Google session expired. Click \"Sign in with Google\" to reconnect.");
		}
		if (message.includes("access_denied")) {
			return new Error("Google authorization was cancelled. Try signing in again.");
		}
		if (message.includes("interaction required")) {
			return new Error('Google Calendar access not granted yet. Use "Sign in with Google" first.');
		}
	}
	return error;
}

async function reopenPopup() {
	if (!chrome?.action?.openPopup) {
		return;
	}
	try {
		await chrome.action.openPopup();
	} catch (error) {
		console.warn("[background] unable to reopen popup", error);
	}
}

async function getCachedToken() {
	try {
		const tokens = await ensureSession();
		return tokens.accessToken;
	} catch (error) {
		throw mapAuthError(error);
	}
}

const MESSAGE_HANDLERS = {
	"auth/interactive": async () => {
		const tokens = await authenticateInteractive();
		await reopenPopup();
		return { token: tokens.accessToken };
	},
	"calendars/list": async () => {
		const token = await getCachedToken();
		const calendars = await listCalendars(token);
		return { calendars };
	},
	"events/list": async (payload = {}) => {
		const token = await getCachedToken();
		const events = await listEvents(token, payload);
		return { events };
	},
	"auth/signOut": async () => {
		await signOut();
		return { signedOut: true };
	},
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (!message || typeof message.type !== "string") {
		return false;
	}

	const handler = MESSAGE_HANDLERS[message.type];
	if (!handler) {
		return false;
	}

	(async () => {
		try {
			const data = await handler(message.payload);
			sendResponse({ success: true, data });
		} catch (error) {
			const normalizedError = error instanceof Error ? error : new Error("Unknown error");
			const message = normalizedError.message ?? "";
			if (message.includes("No Google account connected")) {
				console.info("[background]", message);
			} else {
				console.error("[background]", normalizedError);
			}
			sendResponse({
				success: false,
				error: normalizedError.message,
			});
		}
	})();

	return true;
});
