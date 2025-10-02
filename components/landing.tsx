"use client";
import { motion } from "framer-motion";
import { GoogleLoginButton } from "./auth/google-login-button";
import { AuroraText } from "./ui/aurora-text";
import { InteractiveGridPattern } from "./ui/interactive-grid-pattern";

export function Landing() {
	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
			<div className="absolute inset-0">
				<InteractiveGridPattern width={50} height={50} squares={[50, 30]} />
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
			</div>

			<div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-12 text-center">
				<div className="flex flex-col items-center gap-8">
					<div className="space-y-8">
						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
							className="text-5xl font-medium tracking-tight text-foreground sm:text-6xl lg:text-7xl">
							Schedule meetings in <AuroraText className="inline-block">seconds</AuroraText>
						</motion.h1>
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
							className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
							Connect your calendar and we find mutual availability. It's that simple.
						</motion.p>
					</div>
				</div>
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}>
					<GoogleLoginButton />
				</motion.div>
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
					className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground/70">
					By continuing you agree to share availability and basic profile information so we can coordinate meetings on your behalf.
				</motion.p>
			</div>
		</main>
	);
}
