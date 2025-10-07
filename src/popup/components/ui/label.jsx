import React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../lib/utils.js";

const Label = React.forwardRef(({ className, ...props }, ref) => (
	<LabelPrimitive.Root
		ref={ref}
		className={cn("text-sm font-medium leading-none text-muted-foreground", className)}
		{...props}
	/>
));
Label.displayName = "Label";

export { Label };
