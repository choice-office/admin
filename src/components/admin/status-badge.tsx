import { STATUS_META } from "@/lib/contacts";
import { cn } from "@/lib/utils";
import type { ContactStatus } from "@/types/database";

export const StatusBadge = ({ status }: { status: ContactStatus }) => {
	const m = STATUS_META[status];
	return (
		<span
			className={cn(
				"inline-flex h-[26px] items-center whitespace-nowrap rounded-full px-2.5 font-medium text-[13px]",
				m.badge,
			)}
		>
			{m.label}
		</span>
	);
};
