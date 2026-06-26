import type { CSSProperties, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// 초이스 DS 컴포넌트 — 홈페이지 ds.tsx와 동일. hover/focus는 globals(index.css)의 .ds-* 클래스로.
type Sx = CSSProperties;

/* ── Badge ── */
const badgeVariants: Record<string, Sx> = {
	default: { background: "var(--badge-bg)", color: "var(--badge-fg)" },
	primary: { background: "var(--color-primary)", color: "var(--text-on-brand)" },
	outline: {
		background: "transparent",
		color: "var(--text-body)",
		boxShadow: "inset 0 0 0 1px var(--border-default)",
	},
};

export const Badge = ({
	children,
	variant = "default",
	style,
}: {
	children: ReactNode;
	variant?: string;
	style?: Sx;
}) => (
	<span
		style={{
			display: "inline-flex",
			alignItems: "center",
			gap: 6,
			fontFamily: "var(--font-sans)",
			fontWeight: 500,
			fontSize: 13,
			lineHeight: 1,
			padding: "6px 12px",
			borderRadius: "var(--radius-pill)",
			whiteSpace: "nowrap",
			...badgeVariants[variant],
			...style,
		}}
	>
		{children}
	</span>
);

/* ── Button (hover는 .ds-btn-*:hover) ── */
const btnSizes: Record<string, Sx> = {
	sm: { height: 36, padding: "0 14px", fontSize: 14 },
	md: { height: 44, padding: "0 20px", fontSize: 16 },
	lg: { height: 52, padding: "0 28px", fontSize: 17 },
};

export const Button = ({
	children,
	variant = "primary",
	size = "md",
	disabled = false,
	iconStart,
	iconEnd,
	onClick,
	type = "button",
	style,
}: {
	children?: ReactNode;
	variant?: string;
	size?: string;
	disabled?: boolean;
	iconStart?: ReactNode;
	iconEnd?: ReactNode;
	onClick?: () => void;
	type?: "button" | "submit" | "reset";
	style?: Sx;
}) => (
	<button
		type={type}
		onClick={onClick}
		disabled={disabled}
		className={cn("ds-btn", `ds-btn-${variant}`, disabled && "is-disabled")}
		style={{ ...btnSizes[size], ...style }}
	>
		{iconStart}
		{children}
		{iconEnd}
	</button>
);

/* ── Card ── */
export const Card = ({
	children,
	hover = false,
	padding = "24px",
	style,
	onClick,
}: {
	children: ReactNode;
	hover?: boolean;
	padding?: string | number;
	style?: Sx;
	onClick?: () => void;
}) => {
	const className = cn("ds-card", hover && "is-hover");
	if (onClick) {
		return (
			<button
				type="button"
				className={className}
				onClick={onClick}
				style={{ display: "block", textAlign: "left", width: "100%", padding, ...style }}
			>
				{children}
			</button>
		);
	}
	return (
		<div className={className} style={{ padding, ...style }}>
			{children}
		</div>
	);
};

export const CardTitle = ({ children, style }: { children: ReactNode; style?: Sx }) => (
	<h3
		style={{
			fontSize: "var(--text-h3)",
			fontWeight: 700,
			color: "var(--text-heading)",
			lineHeight: "var(--leading-snug)",
			letterSpacing: "var(--tracking-tight)",
			margin: 0,
			...style,
		}}
	>
		{children}
	</h3>
);

export const CardBody = ({ children, style }: { children: ReactNode; style?: Sx }) => (
	<p
		style={{
			fontSize: "var(--text-base)",
			color: "var(--text-body)",
			lineHeight: "var(--leading-relaxed)",
			margin: "12px 0 0",
			...style,
		}}
	>
		{children}
	</p>
);

/* ── Forms (focus는 .ds-field:focus) ── */
export const Label = ({
	children,
	htmlFor,
	style,
}: {
	children: ReactNode;
	htmlFor?: string;
	style?: Sx;
}) => (
	<label
		htmlFor={htmlFor}
		style={{
			display: "block",
			fontSize: 14,
			fontWeight: 500,
			color: "var(--text-heading)",
			marginBottom: 8,
			...style,
		}}
	>
		{children}
	</label>
);

export const Input = ({
	invalid = false,
	style,
	...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) => (
	<input
		className={cn("ds-field", invalid && "is-invalid")}
		style={{ height: 48, padding: "0 14px", ...style }}
		{...rest}
	/>
);

export const Textarea = ({
	invalid = false,
	rows = 4,
	style,
	...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) => (
	<textarea
		className={cn("ds-field", invalid && "is-invalid")}
		rows={rows}
		style={{ padding: "12px 14px", lineHeight: 1.6, resize: "vertical", ...style }}
		{...rest}
	/>
);
