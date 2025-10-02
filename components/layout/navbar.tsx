import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LogoutButton } from "../auth/logout-button";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";

export async function Navbar() {
	const supabase = await createSupabaseServerClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error && error.message !== "Auth session missing!") {
		console.error("Failed to load authenticated user", error.message);
	}

	const userPhotoUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

	return (
		<header className="fixed inset-x-0 top-0 z-40 bg-transparent">
			<nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link href="/" className="flex items-center gap-3">
					<Image src="/img/logo.png" alt="meetfast" width={40} height={40} className="h-9 w-9 rounded-full" />
					<span className="text-lg font-semibold sm:text-xl">meetfast</span>
				</Link>

				<div className="flex flex-row items-center justify-center gap-4">
					<Button asChild variant="outline" className="border-border text-sm font-medium">
						<a href="mailto:help@meetfast.com" className="flex items-center gap-2">
							<HelpCircle className="h-4 w-4" />
							Help
						</a>
					</Button>

					<AnimatedThemeToggler className="cursor-pointer" />

					{user && userPhotoUrl && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="rounded-full focus:outline-none focus:ring-primary focus:ring-offset-2 cursor-pointer">
									<Image src={userPhotoUrl} alt="Profile" width={36} height={36} className="h-9 w-9 rounded-full" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<LogoutButton />
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</nav>
		</header>
	);
}
