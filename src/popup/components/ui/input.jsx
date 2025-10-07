import React from "react";
import { cn } from "../../lib/utils.js";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
	return (
		<input
			type={type}
			ref={ref}
			className={cn(
				"flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
});
Input.displayName = "Input";

export { Input };
