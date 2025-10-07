import React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils.js";

function Dialog({ open, onOpenChange, children }) {
	React.useEffect(() => {
		if (!open) {
			return undefined;
		}
		const originalOverflow = document.documentElement.style.overflow;
		document.documentElement.style.overflow = "hidden";
		return () => {
			document.documentElement.style.overflow = originalOverflow;
		};
	}, [open]);

	if (!open) {
		return null;
	}

	const handleClose = () => onOpenChange?.(false);

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
			<div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
			<div className="relative z-10 w-full max-w-md">
				{React.Children.map(children, (child) =>
					React.isValidElement(child) ? React.cloneElement(child, { onClose: handleClose }) : child,
				)}
			</div>
		</div>,
		document.body,
	);
}

const DialogContent = React.forwardRef(({ className, onClose, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"rounded-3xl border border-transparent bg-card text-card-foreground shadow-smooth ring-1 ring-border/70",
			className,
		)}
		{...props}
	/>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("flex flex-col space-y-1.5 px-6 pt-6", className)} {...props} />
));
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
	<h3 ref={ref} className={cn("text-lg font-semibold leading-6 tracking-tight", className)} {...props} />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
	<p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

const DialogBody = React.forwardRef(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("px-6 py-4", className)} {...props} />
));
DialogBody.displayName = "DialogBody";

const DialogFooter = React.forwardRef(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("flex items-center justify-end gap-2 px-6 pb-6", className)} {...props} />
));
DialogFooter.displayName = "DialogFooter";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter };
