"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type CalendarSource = {
	id: string;
	summary: string;
	timeZone: string;
	primary: boolean;
	backgroundColor?: string;
	accessRole: string;
};

interface FetchCalendarsResult {
	calendars: CalendarSource[];
	error?: string;
	detail?: string;
}

const DIALOG_TRANSITION_CLASS = "transition-opacity duration-200";

export function CalendarManager() {
	const [calendars, setCalendars] = useState<CalendarSource[]>([]);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [confirmedSelection, setConfirmedSelection] = useState<CalendarSource[]>([]);
	const [isDialogOpen, setDialogOpen] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		const loadCalendars = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await fetch("/api/google/calendars", {
					method: "GET",
					cache: "no-store",
				});

				if (!response.ok) {
					const body = (await response.json().catch(() => ({}))) as Partial<FetchCalendarsResult>;
					throw new Error(body.error ?? `Google calendar request failed (${response.status})`);
				}

				const body = (await response.json()) as FetchCalendarsResult;
				if (!active) return;
				setCalendars(body.calendars);
				setSelectedIds(new Set(body.calendars.filter((calendar) => calendar.primary).map((calendar) => calendar.id)));
			} catch (cause) {
				console.error("Unable to load Google calendars", cause);
				if (!active) return;
				setError(cause instanceof Error ? cause.message : "Unexpected error loading calendars");
			} finally {
				if (active) setIsLoading(false);
			}
		};

		void loadCalendars();

		return () => {
			active = false;
		};
	}, []);

	const toggleCalendar = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const handleConfirmSelection = useCallback(() => {
		const selection = calendars.filter((calendar) => selectedIds.has(calendar.id));
		setConfirmedSelection(selection);
		setDialogOpen(false);
	}, [calendars, selectedIds]);

	const handleOpenDialog = useCallback(() => {
		setSelectedIds(new Set(confirmedSelection.map((calendar) => calendar.id)));
		setDialogOpen(true);
	}, [confirmedSelection]);

	const embedUrl = useMemo(() => {
		if (!confirmedSelection.length) {
			return null;
		}

		const params = new URLSearchParams({
			ctz: confirmedSelection[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
			mode: "week",
			showTitle: "0",
			showDate: "1",
			showPrint: "0",
			showCalendars: "0",
			showTabs: "1",
		});
		confirmedSelection.forEach((calendar) => {
			params.append("src", calendar.id);
		});
		return `https://calendar.google.com/calendar/embed?${params.toString()}`;
	}, [confirmedSelection]);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Button variant="outline" onClick={handleOpenDialog} disabled={isDialogOpen}>
					Update selection
				</Button>
			</div>

			<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				{embedUrl ? (
					<iframe title="Google Calendar" src={embedUrl} className="h-[550px] w-full border-0" loading="lazy" />
				) : (
					<div className="flex h-[280px] flex-col items-center justify-center gap-3 bg-muted/30 text-center">
						<p className="text-sm text-muted-foreground">Select at least one calendar to see it here.</p>
						<Button onClick={handleOpenDialog} disabled={isDialogOpen}>
							Choose calendars
						</Button>
					</div>
				)}
			</div>

			{isDialogOpen ? (
				<CalendarSelectionDialog
					calendars={calendars}
					selectedIds={selectedIds}
					onToggleCalendar={toggleCalendar}
					onClose={() => setDialogOpen(false)}
					onConfirm={handleConfirmSelection}
					isLoading={isLoading}
					error={error}
				/>
			) : null}
		</div>
	);
}

interface CalendarSelectionDialogProps {
	calendars: CalendarSource[];
	selectedIds: Set<string>;
	onToggleCalendar: (id: string) => void;
	onConfirm: () => void;
	onClose: () => void;
	isLoading: boolean;
	error: string | null;
}

function CalendarSelectionDialog({ calendars, selectedIds, onToggleCalendar, onConfirm, onClose, isLoading, error }: CalendarSelectionDialogProps) {
	const hasSelection = selectedIds.size > 0;

	return (
		<div
			className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 ${DIALOG_TRANSITION_CLASS}`}
			role="dialog"
			aria-modal="true">
			<div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold text-foreground">Choose calendars</h3>
						<p className="text-sm text-muted-foreground">Pick the calendars you’d like to display in Meetfast.</p>
					</div>
					<button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted">
						Close
					</button>
				</div>

				<div className="mt-5 space-y-4">
					{isLoading ? (
						<p className="text-sm text-muted-foreground">Loading your Google calendars…</p>
					) : error ? (
						<div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
					) : calendars.length ? (
						<ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
							{calendars.map((calendar) => {
								const checked = selectedIds.has(calendar.id);
								return (
									<li key={calendar.id}>
										<label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-transparent bg-muted/40 px-3 py-2 transition hover:border-border">
											<input
												type="checkbox"
												checked={checked}
												onChange={() => onToggleCalendar(calendar.id)}
												className="mt-1 h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
											/>
											<span className="flex flex-col">
												<span className="text-sm font-medium text-foreground">{calendar.summary}</span>
												<span className="text-xs text-muted-foreground">
													{calendar.primary ? "Primary" : calendar.accessRole?.toLocaleLowerCase()}
												</span>
											</span>
										</label>
									</li>
								);
							})}
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">We couldn’t find any calendars for your Google account.</p>
					)}
				</div>

				<div className="mt-6 flex justify-end gap-3 border-t border-border/60 pt-4">
					<Button variant="outline" onClick={onClose} className="border-border">
						Cancel
					</Button>
					<Button onClick={onConfirm} disabled={!hasSelection}>
						Done
					</Button>
				</div>
			</div>
		</div>
	);
}
