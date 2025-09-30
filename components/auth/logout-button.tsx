"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

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
    <Button onClick={handleLogout} variant="outline" disabled={pending}>
      {pending ? "Signing out..." : "Log out"}
    </Button>
  );
}
