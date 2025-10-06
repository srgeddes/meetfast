# MeetFast Chrome Extension

MeetFast is a Chrome extension that will accelerate meeting prep by connecting directly to Google Calendar. This initial version focuses on establishing authentication and basic data retrieval scaffolding.

## Project layout

- `manifest.template.json` - Manifest v3 template compiled during the build step.
- `src/` - Extension source (popup UI, background service worker, and shared libraries).
- `scripts/` - Node-based tooling for cleaning and building the distributable.
- `.env.example` - Copy to `.env` and provide Google credentials before building.

## Prerequisites

- Node.js 18+
- A Google Cloud project configured for Chrome extension OAuth2 with Calendar API scopes enabled.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file based on `.env.example` and update the values:
   ```bash
   cp .env.example .env
   # Edit .env and set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_API_KEY
   ```
3. Build the extension bundle:
   ```bash
   npm run build
   ```
   The compiled assets live in `dist/` and can be loaded into Chrome as an unpacked extension.

## Loading the extension in Chrome

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/` directory produced by `npm run build`.

## Current capabilities

- Prompts the user to grant Google Calendar access via `chrome.identity`.
- After authentication, fetches the user's calendars and a sample of upcoming events (primary calendar) via background service worker calls.
- Bootstrap-powered popup UI with clear status messaging and quick actions for data retrieval.

## Next steps

- Persist auth state and reflect it in the popup automatically.
- Surface calendar and event data with richer formatting within the popup.
- Handle token refresh/expiration and sign-out flows.
- Expand scopes or additional APIs as core MeetFast features evolve.
