import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import type {
	ButtonHTMLAttributes,
	HTMLAttributes,
	InputHTMLAttributes,
	ReactNode,
	SelectHTMLAttributes,
	TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

// 초이스 DS 컴포넌트 — Tailwind(브랜드 토큰 매핑) 기반. 홈페이지와 동일 시각, admin은 Tailwind로 표현.

/* ── Button ── */
const buttonVariants = cva(
	"inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				primary: "bg-primary text-primary-foreground hover:bg-[var(--color-primary-dark)]",
				outline: "border-border bg-card text-foreground hover:bg-muted",
				secondary: "bg-accent text-accent-foreground hover:bg-[#d6c9b3]",
				ghost: "bg-transparent text-foreground hover:bg-muted",
			},
			size: {
				sm: "h-9 px-3.5 text-sm",
				md: "h-11 px-5 text-base",
				lg: "h-[52px] px-7 text-[17px]",
			},
		},
		defaultVariants: { variant: "primary", size: "md" },
	},
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants> & { iconStart?: ReactNode; iconEnd?: ReactNode };

export const Button = ({
	className,
	variant,
	size,
	iconStart,
	iconEnd,
	children,
	type = "button",
	...rest
}: ButtonProps) => (
	<button type={type} className={cn(buttonVariants({ variant, size }), className)} {...rest}>
		{iconStart}
		{children}
		{iconEnd}
	</button>
);

/* ── Badge ── */
const badgeVariants = cva(
	"inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-medium text-[13px] leading-none",
	{
		variants: {
			variant: {
				default: "bg-accent text-accent-foreground",
				primary: "bg-primary text-primary-foreground",
				outline: "bg-transparent text-foreground ring-1 ring-border ring-inset",
			},
		},
		defaultVariants: { variant: "default" },
	},
);

export const Badge = ({
	className,
	variant,
	children,
}: {
	className?: string;
	variant?: "default" | "primary" | "outline";
	children: ReactNode;
}) => <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;

/* ── Card ── */
export const Card = ({
	className,
	hover = false,
	children,
	...rest
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) => (
	<div
		className={cn(
			"rounded-md border border-border bg-card p-6 shadow-xs",
			hover && "transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(82,70,54,0.1)]",
			className,
		)}
		{...rest}
	>
		{children}
	</div>
);

export const CardTitle = ({ className, children }: { className?: string; children: ReactNode }) => (
	<h3
		className={cn(
			"m-0 font-bold text-foreground text-lg leading-snug tracking-[-0.02em]",
			className,
		)}
	>
		{children}
	</h3>
);

export const CardBody = ({ className, children }: { className?: string; children: ReactNode }) => (
	<p className={cn("mt-3 text-[var(--text-body)] text-base leading-relaxed", className)}>
		{children}
	</p>
);

/* ── Forms ── */
export const Label = ({
	className,
	children,
	htmlFor,
}: {
	className?: string;
	children: ReactNode;
	htmlFor?: string;
}) => (
	<label
		htmlFor={htmlFor}
		className={cn("mb-2 block font-medium text-foreground text-sm", className)}
	>
		{children}
	</label>
);

const fieldClass =
	"w-full rounded-md border border-border bg-card text-base text-[var(--text-body)] outline-none transition focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[rgba(108,93,76,0.18)] aria-[invalid=true]:border-destructive";

export const Input = ({
	className,
	invalid,
	...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) => (
	<input
		aria-invalid={invalid || undefined}
		className={cn(fieldClass, "h-12 px-3.5", className)}
		{...rest}
	/>
);

export const Textarea = ({
	className,
	invalid,
	rows = 4,
	...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) => (
	<textarea
		rows={rows}
		aria-invalid={invalid || undefined}
		className={cn(fieldClass, "resize-none px-3.5 py-3 leading-relaxed", className)}
		{...rest}
	/>
);

/* ── Select — 네이티브 select + DS 스타일(우측 셰브론). 홈페이지 폼 셀렉트와 동일 톤 ── */
export const Select = ({
	className,
	invalid,
	children,
	...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) => (
	<div className="relative">
		<select
			aria-invalid={invalid || undefined}
			className={cn(fieldClass, "h-12 cursor-pointer appearance-none pr-10 pl-3.5", className)}
			{...rest}
		>
			{children}
		</select>
		<ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
	</div>
);
