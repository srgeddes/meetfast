function parseEventDateTime(value) {
	return value ? new Date(value) : null;
}

function parseAllDayDate(value) {
	if (!value) {
		return null;
	}
	const [year, month, day] = value.split("-").map(Number);
	if ([year, month, day].some(Number.isNaN)) {
		return null;
	}
	return new Date(year, month - 1, day);
}

function minutesToMilliseconds(minutes) {
	return minutes * 60 * 1000;
}

export function combineDateAndTime(date, timeValue) {
	const [hours, minutes] = timeValue.split(":").map(Number);
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		Number.isNaN(hours) ? 0 : hours,
		Number.isNaN(minutes) ? 0 : minutes,
		0,
		0,
	);
}

export function extractBusyIntervals(events) {
	const intervals = [];
	events.forEach((event) => {
		if (!event || event.status === "cancelled" || event.transparency === "transparent") {
			return;
		}

		const start = parseEventDateTime(event?.start?.dateTime) ?? parseAllDayDate(event?.start?.date);
		const end = parseEventDateTime(event?.end?.dateTime) ?? parseAllDayDate(event?.end?.date);

		if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
			return;
		}
		if (!(end instanceof Date) || Number.isNaN(end.getTime())) {
			return;
		}
		if (end.getTime() <= start.getTime()) {
			return;
		}

		intervals.push({ start, end });
	});

	intervals.sort((a, b) => a.start.getTime() - b.start.getTime());
	if (!intervals.length) {
		return intervals;
	}

	const merged = [intervals[0]];
	for (let i = 1; i < intervals.length; i += 1) {
		const current = intervals[i];
		const last = merged[merged.length - 1];
		if (current.start.getTime() <= last.end.getTime()) {
			last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
		} else {
			merged.push(current);
		}
	}

	return merged;
}

function slotOverlapsBusyIntervals(slotStart, slotEnd, busyIntervals) {
	return busyIntervals.some(
		(interval) =>
			slotStart.getTime() < interval.end.getTime() && slotEnd.getTime() > interval.start.getTime(),
	);
}

function collectAvailableSlotsForDay(dayStart, dayEnd, busyIntervals, durationMinutes, incrementMinutes) {
	const slots = [];
	const durationMs = minutesToMilliseconds(durationMinutes);
	const incrementMs = minutesToMilliseconds(incrementMinutes);
	const lastPossibleStart = dayEnd.getTime() - durationMs;

	if (lastPossibleStart < dayStart.getTime()) {
		return slots;
	}

	for (let startTime = dayStart.getTime(); startTime <= lastPossibleStart + 1; startTime += incrementMs) {
		const slotStart = new Date(startTime);
		const slotEnd = new Date(startTime + durationMs);

		if (slotEnd.getTime() > dayEnd.getTime()) {
			break;
		}

		if (slotOverlapsBusyIntervals(slotStart, slotEnd, busyIntervals)) {
			continue;
		}

		slots.push({ start: slotStart, end: slotEnd });
	}

	return slots;
}

function groupSlotsIntoWindows(slots) {
	if (!slots.length) {
		return [];
	}

	const windows = [];
	let currentWindowStart = slots[0].start;
	let currentWindowEnd = slots[0].end;

	for (let i = 1; i < slots.length; i += 1) {
		const slot = slots[i];
		if (slot.start.getTime() <= currentWindowEnd.getTime()) {
			if (slot.end.getTime() > currentWindowEnd.getTime()) {
				currentWindowEnd = slot.end;
			}
		} else {
			windows.push({ start: currentWindowStart, end: currentWindowEnd });
			currentWindowStart = slot.start;
			currentWindowEnd = slot.end;
		}
	}

	windows.push({ start: currentWindowStart, end: currentWindowEnd });
	return windows;
}

function isWeekend(date) {
	const day = date.getDay();
	return day === 0 || day === 6;
}

export function buildAvailabilitySchedule(preferences, busyIntervals) {
	const {
		startDate,
		dayCount,
		dayStartValue,
		dayEndValue,
		durationMinutes,
		incrementMinutes,
		includeWeekends,
	} = preferences;

	const availability = [];

	for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
		const targetDate = new Date(
			startDate.getFullYear(),
			startDate.getMonth(),
			startDate.getDate() + dayIndex,
		);

		if (!includeWeekends && isWeekend(targetDate)) {
			continue;
		}

		const dayStart = combineDateAndTime(targetDate, dayStartValue);
		const dayEnd = combineDateAndTime(targetDate, dayEndValue);

		if (dayEnd.getTime() <= dayStart.getTime()) {
			continue;
		}

		const dayBusyIntervals = busyIntervals.filter(
			(interval) => interval.end.getTime() > dayStart.getTime() && interval.start.getTime() < dayEnd.getTime(),
		);

		const slots = collectAvailableSlotsForDay(
			dayStart,
			dayEnd,
			dayBusyIntervals,
			durationMinutes,
			incrementMinutes,
		);

		if (!slots.length) {
			continue;
		}

		const windows = groupSlotsIntoWindows(slots);
		if (!windows.length) {
			continue;
		}

		availability.push({
			date: targetDate,
			windows,
		});
	}

	return availability;
}

export function formatAvailabilityForDisplay(availability) {
	if (!availability.length) {
		return "";
	}

	const dayFormatter = new Intl.DateTimeFormat(undefined, {
		weekday: "long",
		month: "short",
		day: "numeric",
	});

	const timeFormatter = new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});

	const lines = availability.map(({ date, windows }) => {
		const dayLabel = dayFormatter.format(date);
		const windowLabels = windows.map(
			(window) => `${timeFormatter.format(window.start)} - ${timeFormatter.format(window.end)}`,
		);
		return `${dayLabel}: ${windowLabels.join("; ")}`;
	});

	return lines.join("\n");
}

export function getAvailabilityTimeBounds(preferences) {
	const startBoundary = combineDateAndTime(preferences.startDate, preferences.dayStartValue);
	const endDate = new Date(
		preferences.startDate.getFullYear(),
		preferences.startDate.getMonth(),
		preferences.startDate.getDate() + preferences.dayCount - 1,
	);
	const endBoundary = combineDateAndTime(endDate, preferences.dayEndValue);
	const timeMin = startBoundary.toISOString();
	const timeMax = new Date(endBoundary.getTime() + minutesToMilliseconds(preferences.durationMinutes)).toISOString();
	return { timeMin, timeMax };
}
