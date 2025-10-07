import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "../../lib/utils.js";

const Calendar = React.forwardRef(({ className, classNames, showOutsideDays = true, components, ...props }, ref) => (
	<DayPicker
		ref={ref}
		showOutsideDays={showOutsideDays}
		className={cn("rdp", className)}
		classNames={{
			months: "rdp-months",
			month: "rdp-month",
			caption: "rdp-caption",
			caption_label: "rdp-caption_label",
			nav: "rdp-nav",
			nav_button: "rdp-nav_button",
			nav_button_previous: "rdp-nav_button_previous",
			nav_button_next: "rdp-nav_button_next",
			table: "rdp-table",
			head_row: "rdp-head_row",
			head_cell: "rdp-head_cell",
			row: "rdp-row",
			cell: "rdp-cell",
			day: "rdp-day",
			day_button: "rdp-day_button",
			selected: "rdp-day_selected",
			today: "rdp-day_today",
			disabled: "rdp-day_disabled",
			outside: "rdp-day_outside",
			...classNames,
		}}
		components={{
			IconLeft: ({ ...iconProps }) => <ChevronLeft className="h-4 w-4" {...iconProps} />,
			IconRight: ({ ...iconProps }) => <ChevronRight className="h-4 w-4" {...iconProps} />,
			...components,
		}}
		{...props}
	/>
));
Calendar.displayName = "Calendar";

export { Calendar };
