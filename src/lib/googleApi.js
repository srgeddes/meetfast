import { loadExtensionConfig } from "./configLoader.js";

let cachedConfig = null;

async function getConfig() {
	if (cachedConfig) {
		return cachedConfig;
	}
	const config = await loadExtensionConfig();
	cachedConfig = {
		...config,
		CALENDAR_LIST_ENDPOINT: `${config.GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`,
	};
	return cachedConfig;
}

function createAuthHeaders(token, additionalHeaders = {}) {
	return {
		Authorization: `Bearer ${token}`,
		Accept: "application/json",
		...additionalHeaders,
	};
}

async function fetchJson(url, token, { searchParams, ...init } = {}) {
	const requestUrl = new URL(url);
	if (searchParams) {
		Object.entries(searchParams)
			.filter(([, value]) => value !== undefined && value !== null)
			.forEach(([key, value]) => requestUrl.searchParams.set(key, value));
	}

	const response = await fetch(requestUrl.toString(), {
		...init,
		headers: createAuthHeaders(token, init?.headers),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Google API error ${response.status}: ${errorBody}`);
	}

	return response.json();
}

export async function listCalendars(token) {
	const config = await getConfig();
	const data = await fetchJson(config.CALENDAR_LIST_ENDPOINT, token, {
		searchParams: {
			minAccessRole: "reader",
			showHidden: false,
		},
	});
	return data.items ?? [];
}

export async function listEvents(
	token,
	{
		calendarId = "primary",
		timeMin = new Date().toISOString(),
		timeMax,
		maxResults = 10,
		singleEvents = true,
		orderBy = "startTime",
	} = {},
) {
	const config = await getConfig();
	const eventsEndpoint = `${config.GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;
	const data = await fetchJson(eventsEndpoint, token, {
		searchParams: {
			maxResults,
			singleEvents,
			orderBy,
			timeMin,
			timeMax,
		},
	});
	return data.items ?? [];
}
