import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";
import ThemeProvider from "@/components/providers/theme-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Meetfast",
	description: "Coordinate meetings instantly with shared availability",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html className="overscroll-none" lang="en" suppressHydrationWarning>
			<body className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-background text-foreground antialiased`}>
				<ThemeProvider>
					<Navbar />
					<main className="flex flex-1 flex-col pt-20 pb-16">
						<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
							{children}
						</div>
					</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
