import type { User } from "@supabase/supabase-js";
import { CalendarManager } from "@/components/app/calendar-manager";
import ColourfulText from "../ui/colourful-text";

function getTimeBasedGreeting() {
	const hour = new Date().getHours();

	if (hour >= 5 && hour < 12) {
		const morningGreetings = ["Rise and shine", "Early bird gets the worm", "Wakey wakey", "Top of the morning", "Seize the day"];
		return morningGreetings[Math.floor(Math.random() * morningGreetings.length)];
	} else if (hour >= 12 && hour < 17) {
		const afternoonGreetings = ["Crushing it", "Making moves", "In the zone", "Full steam ahead", "On fire today"];
		return afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)];
	} else if (hour >= 17 && hour < 22) {
		const eveningGreetings = ["Winding down", "Golden hour vibes", "Almost there", "Home stretch", "Closing strong"];
		return eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)];
	} else {
		const lateNightGreetings = ["Burning the midnight oil", "Night owl mode", "Hustling hard", "The grind never stops", "Moonlight warrior"];
		return lateNightGreetings[Math.floor(Math.random() * lateNightGreetings.length)];
	}
}

export function Dashboard({ user }: { user: User }) {
	const displayName = user.user_metadata.full_name ?? user.email ?? "there";
	const greeting = getTimeBasedGreeting();

	return (
		<section className="flex flex-1 items-center justify-center py-10">
			<div className="flex w-full max-w-5xl flex-col items-center gap-10 px-4 text-center sm:px-6 lg:px-8">
				<div className="w-full space-y-3">
					<h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
						<ColourfulText text={greeting} />, {displayName.split(" ")[0]}
					</h1>
					<p className="text-base text-muted-foreground sm:text-lg">Connect your calendars and generate your Meetfast link</p>
				</div>

				<div className="w-full">
					<CalendarManager />
				</div>
			</div>
		</section>
	);
}
