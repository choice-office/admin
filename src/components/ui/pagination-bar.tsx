import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { buildPageBlock, isMobilePage } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type PaginationBarProps = {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	className?: string;
};

// 관리자 공용 페이지네이션 — 10개 블록(« ‹ 숫자 › »). 규칙은 buildPageBlock(공개 홈페이지와 동일)에 위임한다.
// 숫자는 테두리 없이 글자만, 이동 버튼만 테두리 상자. 1페이지뿐이면 숫자 "1"만 남는다(자리 유지).
const CELL_CLS =
	"inline-flex h-[30px] min-w-[30px] items-center justify-center text-[13.5px] leading-none transition-colors";
const ARROW_CLS = cn(
	CELL_CLS,
	"rounded-md border border-border bg-card text-foreground hover:border-primary hover:text-primary",
);

export const PaginationBar = ({
	page,
	totalPages,
	onPageChange,
	className,
}: PaginationBarProps) => {
	const { pages, showFirst, showPrev, showNext, showLast } = buildPageBlock(page, totalPages);

	return (
		<nav
			aria-label="페이지 내비게이션"
			className={cn("flex items-center justify-center gap-1", className)}
		>
			{showFirst && (
				<button
					type="button"
					aria-label="첫 페이지"
					onClick={() => onPageChange(1)}
					className={ARROW_CLS}
				>
					<ChevronsLeft size={15} />
				</button>
			)}
			{showPrev && (
				<button
					type="button"
					aria-label="이전 페이지"
					onClick={() => onPageChange(page - 1)}
					className={ARROW_CLS}
				>
					<ChevronLeft size={15} />
				</button>
			)}
			{(showFirst || showPrev) && <span aria-hidden className="w-1.5" />}
			{pages.map((n) => (
				<button
					key={n}
					type="button"
					aria-current={n === page ? "page" : undefined}
					onClick={() => onPageChange(n)}
					className={cn(
						CELL_CLS,
						"px-[7px]",
						n === page
							? "cursor-default font-bold text-primary"
							: "font-medium text-foreground hover:text-primary",
						!isMobilePage(n, page) && "max-sm:hidden",
					)}
				>
					{n}
				</button>
			))}
			{(showNext || showLast) && <span aria-hidden className="w-1.5" />}
			{showNext && (
				<button
					type="button"
					aria-label="다음 페이지"
					onClick={() => onPageChange(page + 1)}
					className={ARROW_CLS}
				>
					<ChevronRight size={15} />
				</button>
			)}
			{showLast && (
				<button
					type="button"
					aria-label="마지막 페이지"
					onClick={() => onPageChange(totalPages)}
					className={ARROW_CLS}
				>
					<ChevronsRight size={15} />
				</button>
			)}
		</nav>
	);
};
