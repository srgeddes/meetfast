import {
  GOOGLE_CALENDAR_API_BASE,
  GOOGLE_CALENDAR_SCOPES,
} from './config.js';

const CALENDAR_LIST_ENDPOINT = `${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`;

function createAuthHeaders(token, additionalHeaders = {}) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...additionalHeaders,
  };
}

function chromeApiCall(fn) {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, (result) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }
        resolve(result);
      });
    });
}

const getAuthTokenInternal = chromeApiCall((options, callback) => {
  chrome.identity.getAuthToken(options, callback);
});

const removeCachedAuthTokenInternal = chromeApiCall((details, callback) => {
  chrome.identity.removeCachedAuthToken(details, callback);
});

export async function getOAuthToken({ interactive = false } = {}) {
  const token = await getAuthTokenInternal({ interactive, scopes: GOOGLE_CALENDAR_SCOPES });
  if (!token) {
    throw new Error('Google identity API did not return a token.');
  }
  return token;
}

export async function removeCachedToken(token) {
  if (!token) {
    return;
  }
  await removeCachedAuthTokenInternal({ token });
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
  const data = await fetchJson(CALENDAR_LIST_ENDPOINT, token, {
    searchParams: {
      minAccessRole: 'reader',
      showHidden: false,
    },
  });
  return data.items ?? [];
}

export async function listEvents(
  token,
  {
    calendarId = 'primary',
    timeMin = new Date().toISOString(),
    timeMax,
    maxResults = 10,
    singleEvents = true,
    orderBy = 'startTime',
  } = {},
) {
  const eventsEndpoint = `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(
    calendarId,
  )}/events`;
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

export async function verifyToken(token) {
  const tokenInfoUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`;
  const response = await fetch(tokenInfoUrl);
  if (!response.ok) {
    return false;
  }
  const payload = await response.json();
  const scopes = payload.scope?.split(' ') ?? [];
  return GOOGLE_CALENDAR_SCOPES.every((scope) => scopes.includes(scope));
}
