import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const alertVariants = cva(
	"relative w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-all",
	{
		variants: {
			variant: {
				default: "border-border bg-card text-card-foreground",
				success: "border-emerald-200 bg-emerald-50 text-emerald-900",
				info: "border-sky-200 bg-sky-50 text-sky-900",
				warning: "border-amber-200 bg-amber-50 text-amber-900",
				destructive: "border-rose-200 bg-rose-50 text-rose-900",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
	<div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
	<h4 ref={ref} className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("text-sm leading-relaxed opacity-90", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
