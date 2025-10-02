"use client";
import { ThemeProvider as NextThemes } from "next-themes";
import { ReactNode } from "react";

export default function ThemeProvider({ children }: { children: ReactNode }) {
	return (
		<NextThemes attribute="class" enableSystem defaultTheme="system">
			{children}
		</NextThemes>
	);
}
