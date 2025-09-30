import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Meetfast",
	description: "Coordinate meetings instantly with shared availability",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html className="overscroll-none" lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased overscroll-none overscroll-hidden`}>
				{children}
			</body>
		</html>
	);
}
