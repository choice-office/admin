import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export type TablePaginationProps = {
	pageIndex: number;
	pageCount: number;
	canPrevious: boolean;
	canNext: boolean;
	onPrevious: () => void;
	onNext: () => void;
	onPage: (idx: number) => void;
};

export const TablePagination = ({
	pageIndex,
	pageCount,
	canPrevious,
	canNext,
	onPrevious,
	onNext,
	onPage,
}: TablePaginationProps) => {
	const getPageNumbers = () => {
		if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i);
		const start = Math.max(0, Math.min(pageIndex - 2, pageCount - 5));
		return Array.from({ length: 5 }, (_, i) => start + i);
	};
	const pageNumbers = getPageNumbers();

	return (
		<div className="flex items-center justify-between border-zinc-200 border-t px-4 py-2">
			<p className="text-xs text-zinc-500">
				{pageCount > 0 ? `${pageIndex + 1} / ${pageCount} 페이지` : "—"}
			</p>
			<Pagination className="mx-0 w-auto">
				<PaginationContent className="gap-0.5">
					<PaginationItem>
						<PaginationPrevious
							text="이전"
							onClick={onPrevious}
							className={cn(
								"rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
								!canPrevious && "pointer-events-none opacity-40",
							)}
						/>
					</PaginationItem>

					{pageNumbers[0] > 0 && (
						<>
							<PaginationItem>
								<PaginationLink
									onClick={() => onPage(0)}
									className="rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
								>
									1
								</PaginationLink>
							</PaginationItem>
							{pageNumbers[0] > 1 && (
								<PaginationItem>
									<PaginationEllipsis className="text-zinc-500" />
								</PaginationItem>
							)}
						</>
					)}

					{pageNumbers.map((n) => (
						<PaginationItem key={n}>
							<PaginationLink
								isActive={n === pageIndex}
								onClick={() => onPage(n)}
								className={cn(
									"rounded",
									n === pageIndex
										? "bg-zinc-900 text-white hover:bg-zinc-800"
										: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
								)}
							>
								{n + 1}
							</PaginationLink>
						</PaginationItem>
					))}

					{pageNumbers[pageNumbers.length - 1] < pageCount - 1 && (
						<>
							{pageNumbers[pageNumbers.length - 1] < pageCount - 2 && (
								<PaginationItem>
									<PaginationEllipsis className="text-zinc-500" />
								</PaginationItem>
							)}
							<PaginationItem>
								<PaginationLink
									onClick={() => onPage(pageCount - 1)}
									className="rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
								>
									{pageCount}
								</PaginationLink>
							</PaginationItem>
						</>
					)}

					<PaginationItem>
						<PaginationNext
							text="다음"
							onClick={onNext}
							className={cn(
								"rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
								!canNext && "pointer-events-none opacity-40",
							)}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
};
