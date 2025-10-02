"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase/client";

export function LogoutButton() {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	const handleLogout = useCallback(() => {
		const supabase = createSupabaseClient();

		startTransition(async () => {
			await supabase.auth.signOut();
			router.refresh();
		});
	}, [router]);

	return (
		<Button onClick={handleLogout} variant="ghost" disabled={pending} className="w-full justify-start gap-2 text-sm font-normal">
			<LogOut className="h-4 w-4" />
			{pending ? "Signing out..." : "Log out"}
		</Button>
	);
}
