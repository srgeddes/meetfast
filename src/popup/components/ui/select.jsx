import React from "react";
import { cn } from "../../lib/utils.js";

const Select = React.forwardRef(({ className, children, ...props }, ref) => (
	<select
		ref={ref}
		className={cn(
			"flex h-11 w-full appearance-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
			className,
		)}
		{...props}
	>
		{children}
	</select>
));
Select.displayName = "Select";

export { Select };
