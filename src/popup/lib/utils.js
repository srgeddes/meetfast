import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
	return twMerge(clsx(...inputs));
}

export function formatError(error) {
	if (!error) {
		return "Something went wrong.";
	}
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return "Unexpected error encountered.";
}
