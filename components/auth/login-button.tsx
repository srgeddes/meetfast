"use client";

import { useCallback, useState } from "react";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase/client";

const GOOGLE_SCOPES = [
	"openid",
	"email",
	"profile",
	"https://www.googleapis.com/auth/calendar",
	"https://www.googleapis.com/auth/calendar.events",
].join(" ");

export function LoginButton() {
	const [loading, setLoading] = useState(false);
	const handleLogin = useCallback(async () => {
		if (loading) return;

		const supabase = createSupabaseClient();
		setLoading(true);

		const fallbackOrigin = process.env.NEXT_PUBLIC_SITE_URL;
		const origin = typeof window !== "undefined" ? window.location.origin : fallbackOrigin;

		if (!origin) {
			console.error("Cannot determine OAuth redirect origin. Set NEXT_PUBLIC_SITE_URL.");
			setLoading(false);
			return;
		}

		const redirectTo = new URL("/auth/callback", origin).toString();

		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo,
				flowType: "pkce",
				scopes: GOOGLE_SCOPES,
				queryParams: {
					access_type: "offline",
					prompt: "consent",
				},
			},
		});

		if (error) {
			console.error("Google sign-in failed", error.message);
			setLoading(false);
		}
	}, [loading]);

	return (
		<Button onClick={handleLogin} variant="outline" size="lg" className="gap-2" disabled={loading}>
			<FcGoogle className="h-5 w-5" />
			<span>{loading ? "Redirecting..." : "Continue with Google"}</span>
		</Button>
	);
}
