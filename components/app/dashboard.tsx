import type { User } from "@supabase/supabase-js";

import { LogoutButton } from "@/components/auth/logout-button";

export function Dashboard({ user }: { user: User }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-3xl space-y-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Welcome back, {user.user_metadata.full_name ?? user.email}!
        </h1>
        <p className="text-base text-slate-600">
          Your Meetfast workspace is ready. Next up: connect calendars, share
          meeting links, and coordinate availability in real time.
        </p>
        <div className="flex items-center justify-center gap-3">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
