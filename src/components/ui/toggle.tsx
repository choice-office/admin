import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const toggleVariants = cva(
	"inline-flex items-center justify-center gap-1.5 rounded-md font-medium text-sm outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			size: {
				default: "h-9 min-w-9 px-2",
				sm: "size-8",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

type ToggleProps = ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof toggleVariants> & {
		pressed?: boolean;
		onPressedChange?: (pressed: boolean) => void;
	};

export const Toggle = ({
	className,
	size,
	pressed = false,
	onPressedChange,
	type = "button",
	...props
}: ToggleProps) => (
	<button
		type={type}
		data-slot="toggle"
		data-state={pressed ? "on" : "off"}
		aria-pressed={pressed}
		onClick={() => onPressedChange?.(!pressed)}
		className={cn(toggleVariants({ size }), className)}
		{...props}
	/>
);
