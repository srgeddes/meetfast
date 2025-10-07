import React from "react";
import { startOfToday } from "date-fns";
import { Alert, AlertDescription } from "./components/ui/alert.jsx";
import { Button } from "./components/ui/button.jsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./components/ui/card.jsx";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./components/ui/dialog.jsx";
import { Input } from "./components/ui/input.jsx";
import { Label } from "./components/ui/label.jsx";
import { Select } from "./components/ui/select.jsx";
import { Switch } from "./components/ui/switch.jsx";
import { DatePicker } from "./components/date-picker.jsx";
import { sendBackgroundRequest, storageSyncGet, storageSyncSet } from "./lib/chrome.js";
import { cn, formatError } from "./lib/utils.js";
import {
	buildAvailabilitySchedule,
	extractBusyIntervals,
	formatAvailabilityForDisplay,
	getAvailabilityTimeBounds,
} from "../lib/scheduler.js";

const STORAGE_KEYS = {
	CALENDARS: "selectedCalendarIds",
};

function createDefaultFormState() {
	return {
		startDate: startOfToday(),
		dayCount: "7",
		dayStart: "09:00",
		dayEnd: "17:00",
		duration: "30",
		increment: "30",
		includeWeekends: false,
	};
}

const DAY_COUNT_OPTIONS = [
	{ label: "Next 3 days", value: "3" },
	{ label: "Next 5 days", value: "5" },
	{ label: "Next 7 days", value: "7" },
	{ label: "Next 10 days", value: "10" },
	{ label: "Next 14 days", value: "14" },
];

const DURATION_OPTIONS = [
	{ label: "15 minutes", value: "15" },
	{ label: "30 minutes", value: "30" },
	{ label: "45 minutes", value: "45" },
	{ label: "60 minutes", value: "60" },
];

const INCREMENT_OPTIONS = [
	{ label: "15 minutes", value: "15" },
	{ label: "30 minutes", value: "30" },
	{ label: "60 minutes", value: "60" },
];

function arraysEqual(a, b) {
	if (a.length !== b.length) {
		return false;
	}
	return a.every((value, index) => value === b[index]);
}

function describeCalendars(calendars, selectedIds) {
	if (!selectedIds.length) {
		return "No calendars selected yet.";
	}
	const names = selectedIds
		.map((id) => calendars.find((calendar) => calendar.id === id))
		.filter(Boolean)
		.map((calendar) => calendar.summary || calendar.id);
	if (!names.length) {
		return "Calendars selected (details not available).";
	}
	if (names.length === 1) {
		return `Using calendar: ${names[0]}`;
	}
	return `Using ${names.length} calendars: ${names.join(", ")}`;
}

function sortCalendars(calendars) {
	return [...calendars].sort((a, b) => {
		if (a.primary && !b.primary) {
			return -1;
		}
		if (!a.primary && b.primary) {
			return 1;
		}
		return (a.summary || "").localeCompare(b.summary || "");
	});
}

export default function App() {
	const [status, setStatus] = React.useState(null);
	const [isAuthenticated, setIsAuthenticated] = React.useState(false);
	const [authLoading, setAuthLoading] = React.useState(false);
	const [calendars, setCalendars] = React.useState([]);
	const [selectedCalendarIds, setSelectedCalendarIds] = React.useState([]);
	const [formState, setFormState] = React.useState(() => createDefaultFormState());
	const [calendarDialogOpen, setCalendarDialogOpen] = React.useState(false);
	const [pendingCalendarSelection, setPendingCalendarSelection] = React.useState([]);
	const [availabilityText, setAvailabilityText] = React.useState("");
	const [availabilityLoading, setAvailabilityLoading] = React.useState(false);

	const selectedCalendarIdsRef = React.useRef([]);
	const minStartDate = React.useMemo(() => startOfToday(), []);

	function updateSelectedCalendarIds(nextIds) {
		selectedCalendarIdsRef.current = nextIds;
		setSelectedCalendarIds(nextIds);
	}

	React.useEffect(() => {
		selectedCalendarIdsRef.current = selectedCalendarIds;
	}, [selectedCalendarIds]);

	const hasCalendarsSelected = selectedCalendarIds.length > 0;

	React.useEffect(() => {
		let mounted = true;

	async function initialize() {
		let storedIds = [];
		try {
			const stored = await storageSyncGet([STORAGE_KEYS.CALENDARS]);
			if (Array.isArray(stored?.[STORAGE_KEYS.CALENDARS])) {
				storedIds = stored[STORAGE_KEYS.CALENDARS];
			}
		} catch (error) {
			console.warn("[popup] failed to load stored selection", error);
		}

		try {
			const { calendars: fetchedCalendars } = await sendBackgroundRequest("calendars/list");
			if (!mounted) {
				return;
			}
			setIsAuthenticated(true);
			const sorted = sortCalendars(fetchedCalendars ?? []);
			setCalendars(sorted);
			const validIdSet = new Set(sorted.map((calendar) => calendar.id));
			let nextIds = storedIds.filter((id) => validIdSet.has(id));
			if (!nextIds.length && sorted.length) {
				const primary = sorted.find((calendar) => calendar.primary);
				const defaultId = primary?.id ?? sorted[0].id;
				nextIds = [defaultId];
			}
			if (!arraysEqual(nextIds, storedIds)) {
				await persistSelection(nextIds);
			}
			updateSelectedCalendarIds(nextIds);
			setStatus({
				variant: "success",
				message: "Google Calendar connected.",
			});
		} catch (error) {
			if (!mounted) {
				return;
			}
			setIsAuthenticated(false);
			const message = error instanceof Error ? error.message : String(error);
			if (message.toLowerCase().includes("no google account connected")) {
				setStatus({
					variant: "info",
					message: "Connect your Google account to get started.",
				});
			} else if (!message.toLowerCase().includes("authorization was cancelled")) {
				setStatus({
					variant: "warning",
					message,
				});
			}
		}
	}

		initialize();

		return () => {
			mounted = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function refreshCalendars({ silent = false } = {}) {
		try {
			const { calendars: fetchedCalendars } = await sendBackgroundRequest("calendars/list");
			setIsAuthenticated(true);
			const sorted = sortCalendars(fetchedCalendars ?? []);
			setCalendars(sorted);
			const validIdSet = new Set(sorted.map((calendar) => calendar.id));
			let nextIds = selectedCalendarIdsRef.current.filter((id) => validIdSet.has(id));
			if (!nextIds.length && sorted.length) {
				nextIds = [sorted[0].id];
			}
			if (!arraysEqual(nextIds, selectedCalendarIdsRef.current)) {
				updateSelectedCalendarIds(nextIds);
				await persistSelection(nextIds);
			}
			if (!silent) {
				setStatus({
					variant: "success",
					message: `Loaded ${sorted.length} calendar${sorted.length === 1 ? "" : "s"}.`,
				});
			}
			return sorted;
		} catch (error) {
			const normalized = formatError(error);
			if (!silent) {
				setStatus({
					variant: "warning",
					message: normalized,
				});
			}
			throw error;
		}
	}

	async function handleSignIn() {
		setAuthLoading(true);
		setStatus({
			variant: "info",
			message: "Opening Google sign-in…",
		});

		try {
			await sendBackgroundRequest("auth/interactive");
			setStatus({
				variant: "success",
				message: "Google account connected.",
			});
			const updatedCalendars = await refreshCalendars({ silent: true });
			if (updatedCalendars.length) {
				const currentSelection = selectedCalendarIdsRef.current;
				setCalendarDialogOpen(true);
				setPendingCalendarSelection(
					currentSelection.length ? [...currentSelection] : [updatedCalendars[0].id],
				);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (message.includes("message port closed")) {
				// Popup was closed during auth and will reopen automatically.
				return;
			}
			setStatus({
				variant: "destructive",
				message,
			});
		} finally {
			setAuthLoading(false);
		}
	}

	function openCalendarDialog() {
		setPendingCalendarSelection([...selectedCalendarIdsRef.current]);
		setCalendarDialogOpen(true);
	}

	function togglePendingCalendar(id) {
		setPendingCalendarSelection((current) => {
			if (current.includes(id)) {
				return current.filter((existing) => existing !== id);
			}
			return [...current, id];
		});
	}

	async function persistSelection(ids) {
		try {
			await storageSyncSet({ [STORAGE_KEYS.CALENDARS]: ids });
		} catch (error) {
			console.warn("[popup] failed to persist calendar selection", error);
		}
	}

	async function handleConfirmCalendars() {
		if (!pendingCalendarSelection.length) {
			setStatus({
				variant: "warning",
				message: "Select at least one calendar to continue.",
			});
			return;
		}
		updateSelectedCalendarIds(pendingCalendarSelection);
		await persistSelection(pendingCalendarSelection);
		setCalendarDialogOpen(false);
		setStatus({
			variant: "success",
			message: `Using ${pendingCalendarSelection.length} calendar${
				pendingCalendarSelection.length === 1 ? "" : "s"
			}.`,
		});
	}

	function handleFormChange(field, value) {
		let nextValue = value;
		if (field === "startDate" && value instanceof Date) {
			nextValue = new Date(value);
			nextValue.setHours(0, 0, 0, 0);
		}
		setFormState((current) => ({
			...current,
			[field]: nextValue,
		}));
	}

	function validatePreferences() {
		const startDate = formState.startDate instanceof Date ? formState.startDate : null;
		if (!startDate || Number.isNaN(startDate.getTime())) {
			throw new Error("Select a valid start date.");
		}

		const dayCount = Number.parseInt(formState.dayCount, 10);
		if (Number.isNaN(dayCount) || dayCount < 1 || dayCount > 31) {
			throw new Error("Choose a valid number of days to include.");
		}

		if (!formState.dayStart || !formState.dayEnd) {
			throw new Error("Provide a valid daily time window.");
		}

		const dayStart = formState.dayStart;
		const dayEnd = formState.dayEnd;
		const start = parseInt(dayStart.replace(":", ""), 10);
		const end = parseInt(dayEnd.replace(":", ""), 10);
		if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
			throw new Error("End time must be after start time.");
		}

		const durationMinutes = Number.parseInt(formState.duration, 10);
		if (Number.isNaN(durationMinutes) || durationMinutes < 5) {
			throw new Error("Meeting length looks incorrect.");
		}

		const incrementMinutes = Number.parseInt(formState.increment, 10);
		if (Number.isNaN(incrementMinutes) || incrementMinutes < 5) {
			throw new Error("Slot increments look incorrect.");
		}

		return {
			startDate,
			dayCount,
			dayStartValue: dayStart,
			dayEndValue: dayEnd,
			durationMinutes,
			incrementMinutes,
			includeWeekends: formState.includeWeekends,
		};
	}

	async function generateAvailability(preferences) {
		if (!selectedCalendarIds.length) {
			throw new Error("Select at least one calendar.");
		}

		const { timeMin, timeMax } = getAvailabilityTimeBounds(preferences);

		const eventResponses = await Promise.all(
			selectedCalendarIds.map((calendarId) =>
				sendBackgroundRequest("events/list", {
					calendarId,
					timeMin,
					timeMax,
					singleEvents: true,
					orderBy: "startTime",
					maxResults: 2500,
				}).then((response) => response.events ?? []),
			),
		);

		const allEvents = eventResponses.flat();
		const busyIntervals = extractBusyIntervals(allEvents);
		const availability = buildAvailabilitySchedule(preferences, busyIntervals);
		return formatAvailabilityForDisplay(availability);
	}

	async function handleSubmit(event) {
		event.preventDefault();

		if (!selectedCalendarIds.length) {
			setStatus({
				variant: "warning",
				message: "Pick at least one calendar before generating availability.",
			});
			return;
		}

		let preferences;
		try {
			preferences = validatePreferences();
		} catch (error) {
			setStatus({
				variant: "warning",
				message: formatError(error),
			});
			return;
		}

		setAvailabilityLoading(true);
		setStatus({
			variant: "info",
			message: "Crunching your calendar data…",
		});
		setAvailabilityText("");

		try {
			const text = await generateAvailability(preferences);
			if (!text) {
				setStatus({
					variant: "warning",
					message: "No free time blocks found within that window.",
				});
				setAvailabilityText("");
				return;
			}
			setAvailabilityText(text);
			let copied = false;
			try {
				await navigator.clipboard.writeText(text);
				copied = true;
			} catch (copyError) {
				console.warn("[popup] clipboard write failed", copyError);
			}
			setStatus({
				variant: "success",
				message: copied
					? "Availability ready and copied to your clipboard."
					: "Availability ready. Use the copy button to share it.",
			});
		} catch (error) {
			setStatus({
				variant: "destructive",
				message: formatError(error),
			});
		} finally {
			setAvailabilityLoading(false);
		}
	}

	async function handleCopyClick() {
		if (!availabilityText) {
			return;
		}
		try {
			await navigator.clipboard.writeText(availabilityText);
			setStatus({
				variant: "success",
				message: "Availability copied to clipboard.",
			});
		} catch (error) {
			setStatus({
				variant: "warning",
				message: "Unable to copy automatically. Try copying the text manually.",
			});
		}
	}

	const showForm = isAuthenticated && hasCalendarsSelected;

	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-transparent p-4">
			<div className="relative mx-auto w-full max-w-[520px] rounded-[28px] bg-white shadow-smooth ring-1 ring-slate-100">
				<div className="space-y-6 p-8">
					<header className="space-y-2 text-center">
						<h1 className="text-2xl font-semibold tracking-tight text-slate-900">MeetFast</h1>
						<p className="text-sm text-muted-foreground">
							Generate and share your availability across multiple Google Calendars in seconds.
						</p>
					</header>

					{status && (
						<Alert
							variant={
								status.variant === "danger" ? "destructive" : status.variant === "error" ? "destructive" : status.variant
							}
						>
							<AlertDescription>{status.message}</AlertDescription>
						</Alert>
					)}

					<section className="space-y-3">
						<Button
							size="lg"
							className="w-full text-base"
							disabled={authLoading}
							onClick={handleSignIn}
						>
							{authLoading ? "Working…" : isAuthenticated ? "Reconnect Google" : "Sign in with Google"}
						</Button>
						<Button
							variant="outline"
							className={cn("w-full text-base transition-opacity", {
								"pointer-events-none opacity-40": !isAuthenticated,
							})}
							onClick={openCalendarDialog}
						>
							Choose calendars
						</Button>
						{isAuthenticated && (
							<p className="text-center text-sm text-muted-foreground">
								{describeCalendars(calendars, selectedCalendarIds)}
							</p>
						)}
					</section>

					{showForm && (
						<Card className="bg-white">
							<CardHeader className="pb-2">
								<CardTitle className="text-lg">Meeting preferences</CardTitle>
								<CardDescription>
									Set your availability window and slot lengths, then let MeetFast crunch the calendar.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 pt-4">
								<form className="space-y-4" onSubmit={handleSubmit}>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
						<Label htmlFor="startDate">Start date</Label>
						<DatePicker
							value={formState.startDate}
							onChange={(date) => handleFormChange("startDate", date)}
							min={minStartDate}
							id="startDate"
							placeholder="Select start date"
						/>
					</div>
										<div className="space-y-2">
											<Label htmlFor="dayCount">Days to include</Label>
											<Select
												id="dayCount"
												value={formState.dayCount}
												onChange={(event) => handleFormChange("dayCount", event.target.value)}
											>
												{DAY_COUNT_OPTIONS.map((option) => (
													<option key={option.value} value={option.value}>
														{option.label}
													</option>
												))}
											</Select>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="dayStart">Day starts at</Label>
											<Input
												id="dayStart"
												type="time"
												value={formState.dayStart}
												onChange={(event) => handleFormChange("dayStart", event.target.value)}
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="dayEnd">Day ends at</Label>
											<Input
												id="dayEnd"
												type="time"
												value={formState.dayEnd}
												onChange={(event) => handleFormChange("dayEnd", event.target.value)}
												required
											/>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="duration">Meeting length</Label>
											<Select
												id="duration"
												value={formState.duration}
												onChange={(event) => handleFormChange("duration", event.target.value)}
											>
												{DURATION_OPTIONS.map((option) => (
													<option key={option.value} value={option.value}>
														{option.label}
													</option>
												))}
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="increment">Slot increments</Label>
											<Select
												id="increment"
												value={formState.increment}
												onChange={(event) => handleFormChange("increment", event.target.value)}
											>
												{INCREMENT_OPTIONS.map((option) => (
													<option key={option.value} value={option.value}>
														{option.label}
													</option>
												))}
											</Select>
										</div>
									</div>

									<div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-3">
										<div>
											<p className="text-sm font-medium text-slate-900">Include weekends</p>
											<p className="text-xs text-muted-foreground">
												Toggle to include Saturday and Sunday availability.
											</p>
										</div>
										<Switch
											checked={formState.includeWeekends}
											onCheckedChange={(value) => handleFormChange("includeWeekends", value)}
										/>
									</div>

									<Button
										size="lg"
										type="submit"
										className="w-full text-base"
										disabled={availabilityLoading}
									>
										{availabilityLoading ? "Generating…" : "Generate availability"}
									</Button>
								</form>
							</CardContent>
						</Card>
					)}

					{availabilityText && (
						<Card className="bg-slate-50">
							<CardHeader className="flex flex-row items-center justify-between space-y-0">
								<div>
									<CardTitle className="text-base">Availability preview</CardTitle>
									<CardDescription>Ready to paste anywhere.</CardDescription>
								</div>
								<Button variant="outline" size="sm" onClick={handleCopyClick}>
									Copy
								</Button>
							</CardHeader>
							<CardContent>
								<pre className="whitespace-pre-wrap rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-inner ring-1 ring-slate-200">
									{availabilityText}
								</pre>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			<Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Choose calendars</DialogTitle>
						<DialogDescription>
							Select every calendar MeetFast should reference when calculating availability.
						</DialogDescription>
					</DialogHeader>
					<DialogBody className="space-y-3">
						{calendars.length === 0 && (
							<p className="text-sm text-muted-foreground">No calendars found for this account.</p>
						)}
						<div className="space-y-2">
							{calendars.map((calendar) => {
								const checked = pendingCalendarSelection.includes(calendar.id);
								return (
									<label
										key={calendar.id}
										className={cn(
											"flex cursor-pointer items-start justify-between rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300",
											checked && "border-primary bg-primary/5",
										)}
									>
										<div>
											<p className="text-sm font-medium text-slate-900">
												{calendar.summary || "Untitled calendar"}
											</p>
											<p className="text-xs text-muted-foreground">
												{calendar.primary ? "Primary calendar" : calendar.id}
											</p>
										</div>
										<input
											type="checkbox"
											className="mt-1 h-4 w-4 rounded border border-slate-300"
											checked={checked}
											onChange={() => togglePendingCalendar(calendar.id)}
										/>
									</label>
								);
							})}
						</div>
					</DialogBody>
					<DialogFooter>
						<Button variant="ghost" onClick={() => setCalendarDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleConfirmCalendars}>Use selected calendars</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
