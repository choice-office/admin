import dayjs from "dayjs";
import { CalendarDays, Mail } from "lucide-react";
import { useMemo } from "react";
import type { Contact } from "@/types/database";

type StatsCardsProps = {
	contacts: Contact[];
};

export const StatsCards = ({ contacts }: StatsCardsProps) => {
	const todayCount = useMemo(() => {
		const todayStr = dayjs().format("YYYY-MM-DD");
		return contacts.filter((c) => c.created_at.slice(0, 10) === todayStr).length;
	}, [contacts]);

	return (
		<div className="grid shrink-0 grid-cols-2 gap-3">
			<div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3">
				<Mail className="h-4 w-4 shrink-0 text-zinc-400" />
				<div className="min-w-0">
					<p className="text-xs text-zinc-500">총 문의</p>
					<p className="mt-0.5 font-semibold text-xl text-zinc-900 tabular-nums leading-none">
						{contacts.length}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3">
				<CalendarDays className="h-4 w-4 shrink-0 text-zinc-400" />
				<div className="min-w-0">
					<p className="text-xs text-zinc-500">오늘 접수</p>
					<p className="mt-0.5 font-semibold text-xl text-zinc-900 tabular-nums leading-none">
						{todayCount}
					</p>
				</div>
			</div>
		</div>
	);
};
