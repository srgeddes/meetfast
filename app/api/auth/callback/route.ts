import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

function resolveNextPath(next: string | null) {
	if (!next) {
		return "/";
	}

	return next.startsWith("/") ? next : "/";
}

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const error = requestUrl.searchParams.get("error");
	const next = resolveNextPath(requestUrl.searchParams.get("next"));

	if (error) {
		console.error("Supabase OAuth error", error);
		return NextResponse.redirect(`${requestUrl.origin}/?authError=${encodeURIComponent(error)}`);
	}

	if (code) {
		const supabase = await createSupabaseRouteHandlerClient();
		const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
		if (exchangeError) {
			console.error("Failed to exchange auth code", exchangeError.message);
			return NextResponse.redirect(`${requestUrl.origin}/?authError=exchange_failed`);
		}
	}

	return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
