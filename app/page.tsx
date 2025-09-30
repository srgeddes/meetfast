import { Dashboard } from "@/components/app/dashboard";
import { Landing } from "@/components/landing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && error.message !== "Auth session missing!") {
    console.error("Failed to load authenticated user", error.message);
  }

  if (!user) {
    return <Landing />;
  }

  return <Dashboard user={user} />;
}
