const signInButton = document.getElementById('signInButton');
const signInSpinner = document.getElementById('signInSpinner');
const signInLabel = document.getElementById('signInLabel');
const statusAlert = document.getElementById('statusAlert');
const refreshCalendarsButton = document.getElementById('refreshCalendarsButton');
const fetchEventsButton = document.getElementById('fetchEventsButton');
const resultsContainer = document.getElementById('results');

const VARIANT_CLASS_MAP = {
  success: 'alert-success',
  info: 'alert-info',
  warning: 'alert-warning',
  danger: 'alert-danger',
};

function setButtonLoading(isLoading) {
  signInButton.disabled = isLoading;
  signInSpinner.classList.toggle('d-none', !isLoading);
  signInLabel.textContent = isLoading ? 'Working...' : 'Sign in with Google';
}

function showAlert(variant, message) {
  statusAlert.textContent = message;
  statusAlert.className = `alert ${VARIANT_CLASS_MAP[variant] ?? 'alert-info'}`;
}

function renderResults(title, data) {
  resultsContainer.innerHTML = '';
  const header = document.createElement('h2');
  header.className = 'h6';
  header.textContent = title;

  const pre = document.createElement('pre');
  pre.className = 'mb-0';

  const code = document.createElement('code');
  code.textContent = JSON.stringify(data, null, 2);

  pre.appendChild(code);
  resultsContainer.append(header, pre);
}

function clearResults() {
  resultsContainer.textContent = '';
}

function enablePostAuthActions() {
  refreshCalendarsButton.classList.remove('d-none');
  fetchEventsButton.classList.remove('d-none');
}

async function sendBackgroundRequest(type, payload = {}) {
  const response = await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (result) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(result);
    });
  });

  if (!response) {
    throw new Error('No response from background service.');
  }

  if (!response.success) {
    throw new Error(response.error ?? 'Unknown background error.');
  }

  return response.data;
}

async function handleSignIn() {
  clearResults();
  setButtonLoading(true);
  showAlert('info', 'Requesting access to Google Calendar...');

  try {
    await sendBackgroundRequest('auth/interactive');
    showAlert('success', 'Google account connected.');
    enablePostAuthActions();
  } catch (error) {
    console.error('[popup] sign-in failed', error);
    showAlert('danger', error.message);
  } finally {
    setButtonLoading(false);
  }
}

async function handleFetchCalendars() {
  showAlert('info', 'Fetching calendar list...');
  try {
    const { calendars } = await sendBackgroundRequest('calendars/list');
    renderResults('Calendars', calendars);
    showAlert('success', `Loaded ${calendars.length} calendars.`);
  } catch (error) {
    console.error('[popup] calendars/list failed', error);
    showAlert('danger', error.message);
  }
}

async function handleFetchEvents() {
  showAlert('info', 'Fetching upcoming events...');
  try {
    const { events } = await sendBackgroundRequest('events/list', {
      maxResults: 5,
    });
    renderResults('Upcoming events (primary calendar)', events);
    showAlert('success', `Loaded ${events.length} events.`);
  } catch (error) {
    console.error('[popup] events/list failed', error);
    showAlert('danger', error.message);
  }
}

signInButton.addEventListener('click', handleSignIn);
refreshCalendarsButton.addEventListener('click', handleFetchCalendars);
fetchEventsButton.addEventListener('click', handleFetchEvents);
