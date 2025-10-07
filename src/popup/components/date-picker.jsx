import React from "react";
import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../lib/utils.js";
import { Button } from "./ui/button.jsx";
import { Calendar } from "./ui/calendar.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover.jsx";

function normalizeDate(date) {
	if (!date) {
		return undefined;
	}
	const normalized = new Date(date);
	normalized.setHours(0, 0, 0, 0);
	return normalized;
}

export function DatePicker({ value, onChange, min, id, placeholder = "Pick a date" }) {
	const selectedDate = normalizeDate(value);
	const minDate = normalizeDate(min);

	function handleSelect(date) {
		if (!date) {
			return;
		}
		onChange?.(normalizeDate(date));
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					id={id}
					variant="outline"
					className={cn(
						"w-full justify-start text-left font-normal",
						!selectedDate && "text-muted-foreground",
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{selectedDate ? format(selectedDate, "PPP") : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selectedDate}
					onSelect={handleSelect}
					disabled={minDate ? { before: minDate } : undefined}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
