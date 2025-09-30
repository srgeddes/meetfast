import Image from "next/image";
import { LoginButton } from "./auth/login-button";
import { AuroraText } from "./ui/aurora-text";

export function Landing() {
	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center bg-black px-6 py-16 overflow-hidden">
			{/* Subtle grid background */}
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

			<div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-12 text-center">
				<Image src="/img/logo.png" alt="Logo" width={100} height={100} className="opacity-90" />

				<div className="space-y-6">
					<p className="text-5xl text-neutral-100 sm:text-6xl lg:text-7xl">
						Schedule meetings in <AuroraText>seconds</AuroraText>
					</p>
				</div>

				<LoginButton />
				<p className="text-lg text-zinc-400 font-light max-w-lg mx-auto">
					Connect your calendar, surface mutual availability instantly, and lock in the perfect time.
				</p>

				<p className="text-xs text-zinc-600 max-w-md">
					By continuing you agree to share your calendar availability and basic profile information so we can create meetings on your behalf.
				</p>
			</div>

			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
		</main>
	);
}
