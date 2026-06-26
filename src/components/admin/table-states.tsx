import { Inbox } from "lucide-react";

export const LoadingSpinner = () => (
	<div role="status" aria-label="불러오는 중" className="flex flex-1 items-center justify-center">
		<div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
	</div>
);

type EmptyStateProps = {
	hasFilter: boolean;
};

export const EmptyState = ({ hasFilter }: EmptyStateProps) => (
	<div className="flex flex-1 flex-col items-center justify-center gap-2">
		<Inbox className="h-8 w-8 text-zinc-300" />
		<div className="text-center">
			<p className="font-medium text-sm text-zinc-500">
				{hasFilter ? "검색 조건에 맞는 문의가 없습니다" : "접수된 문의가 없습니다"}
			</p>
			<p className="mt-0.5 text-xs text-zinc-500">
				{hasFilter ? "조건을 변경해 다시 시도해 보세요" : "새 문의가 들어오면 여기에 표시됩니다"}
			</p>
		</div>
	</div>
);
