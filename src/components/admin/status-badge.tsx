import { STATUS_META } from "@/lib/contacts";
import type { ContactStatus } from "@/types/database";

export const StatusBadge = ({ status }: { status: ContactStatus }) => {
	const m = STATUS_META[status];
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				height: 26,
				padding: "0 10px",
				borderRadius: "var(--radius-pill)",
				fontSize: 13,
				fontWeight: 500,
				background: m.bg,
				color: m.fg,
				border: m.border ? `1px solid ${m.border}` : "none",
				whiteSpace: "nowrap",
			}}
		>
			{m.label}
		</span>
	);
};
