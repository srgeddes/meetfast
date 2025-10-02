import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

interface GoogleCalendarListItem {
	id?: string;
	summary?: string;
	timeZone?: string;
	primary?: boolean;
	backgroundColor?: string;
	accessRole?: string;
}

interface GoogleCalendarListResponse {
	items?: GoogleCalendarListItem[];
}

interface GoogleTokenRefreshResponse {
	access_token: string;
	expires_in: number;
	scope: string;
	token_type: string;
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export async function GET() {
	try {
		const supabase = await createSupabaseRouteHandlerClient();
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const providerToken = session.provider_token;
		const providerRefreshToken = session.provider_refresh_token;

		if (!providerToken && !(providerRefreshToken && googleClientId && googleClientSecret)) {
			return NextResponse.json({ error: "Missing Google access token" }, { status: 400 });
		}

		let accessToken = providerToken;

		const calendarResponse = await fetchCalendarList(accessToken);
		let responseToUse = calendarResponse;

		if ((calendarResponse.status === 401 || calendarResponse.status === 403) && providerRefreshToken && googleClientId && googleClientSecret) {
			const refreshed = await refreshGoogleAccessToken({
				refreshToken: providerRefreshToken,
				clientId: googleClientId,
				clientSecret: googleClientSecret,
			});
			if (refreshed) {
				accessToken = refreshed.access_token;
				responseToUse = await fetchCalendarList(accessToken);
			}
		}

		if (!responseToUse.ok) {
			const detail = await safeReadText(responseToUse);
			return NextResponse.json(
				{ error: "Failed to load calendars", detail: detail || undefined },
				{ status: responseToUse.status }
			);
		}

		const data = (await responseToUse.json()) as GoogleCalendarListResponse;
		const calendars = (data.items ?? [])
			.filter((item): item is GoogleCalendarListItem & { id: string } => Boolean(item.id))
			.map((item) => ({
				id: item.id!,
				summary: item.summary ?? item.id!,
				timeZone: item.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
				primary: Boolean(item.primary),
				backgroundColor: item.backgroundColor ?? undefined,
				accessRole: item.accessRole ?? "reader",
			}));

		return NextResponse.json({ calendars });
	} catch (error) {
		console.error("Failed to fetch Google calendars", error);
		return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
	}
}

async function fetchCalendarList(accessToken?: string | null) {
	if (!accessToken) {
		return new Response("Missing access token", { status: 400 });
	}

	return fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/json",
		},
		cache: "no-store",
	});
}

async function refreshGoogleAccessToken({
	refreshToken,
	clientId,
	clientSecret,
}: {
	refreshToken: string;
	clientId: string;
	clientSecret: string;
}): Promise<GoogleTokenRefreshResponse | null> {
	try {
		const body = new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			refresh_token: refreshToken,
			grant_type: "refresh_token",
		});

		const response = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});

		if (!response.ok) {
			const detail = await safeReadText(response);
			console.error("Failed to refresh Google access token", detail);
			return null;
		}

		return (await response.json()) as GoogleTokenRefreshResponse;
	} catch (error) {
		console.error("Unexpected error refreshing Google access token", error);
		return null;
	}
}

async function safeReadText(response: Response) {
	try {
		const clone = response.clone();
		const text = await clone.text();
		if (!text) return null;
		try {
			const parsed = JSON.parse(text) as {
				error?: {
					code?: number;
					message?: string;
					errors?: Array<{ reason?: string; message?: string }>;
				};
			};
			if (parsed?.error) {
				const reason = parsed.error.errors?.[0]?.reason;
				const message = parsed.error.errors?.[0]?.message ?? parsed.error.message;
				if (reason === "accessNotConfigured") {
					return "Google Calendar API is not enabled for the linked Google Cloud project. Enable it in console.cloud.google.com/apis/library/calendar-json.googleapis.com for your OAuth credentials.";
				}
				return message ?? text;
			}
		} catch (jsonError) {
			console.warn("Failed to parse Google error response as JSON", jsonError);
		}
		return text;
	} catch (error) {
		console.error("Failed to read response body", error);
		return null;
	}
}
