import {
  getOAuthToken,
  removeCachedToken,
  listCalendars,
  listEvents,
} from './lib/googleApi.js';

function mapAuthError(error) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('not been granted') || message.includes('not authorized')) {
      return new Error('Google Calendar access not granted yet. Use "Sign in with Google" first.');
    }
    if (message.includes('user not signed in')) {
      return new Error('No Google account connected. Try signing in again.');
    }
  }
  return error;
}

async function getCachedToken() {
  try {
    return await getOAuthToken({ interactive: false });
  } catch (error) {
    throw mapAuthError(error);
  }
}

const MESSAGE_HANDLERS = {
  'auth/interactive': async () => {
    const token = await getOAuthToken({ interactive: true });
    return { token };
  },
  'calendars/list': async () => {
    const token = await getCachedToken();
    const calendars = await listCalendars(token);
    return { calendars };
  },
  'events/list': async (payload = {}) => {
    const token = await getCachedToken();
    const events = await listEvents(token, payload);
    return { events };
  },
  'auth/signOut': async () => {
    const token = await getCachedToken();
    await removeCachedToken(token);
    return { signedOut: true };
  },
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') {
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
      const normalizedError = error instanceof Error ? error : new Error('Unknown error');
      console.error('[background]', normalizedError);
      sendResponse({
        success: false,
        error: normalizedError.message,
      });
    }
  })();

  return true; // Keep the message channel open for async response.
});
