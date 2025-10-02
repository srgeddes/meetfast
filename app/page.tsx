import { Dashboard } from "@/components/app/dashboard";
import { Landing } from "@/components/landing";
import { getAuthenticatedUser } from "@/lib/helpers/auth/auth-helpers";

export default async function HomePage() {
	const user = await getAuthenticatedUser();

	if (!user) {
		return <Landing />;
	}

	return <Dashboard user={user} />;
}
