import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { ReactNode } from "react";
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
// 안 쓰이는 이동 버튼과 마지막 블록의 빈 번호는 자리를 비워 둬서(invisible) 페이지를 넘겨도 버튼이 밀리지 않는다.
// 좌우 여백을 두지 않아 한 자리("1")와 두 자리("20") 칸 폭이 같다.
const CELL_CLS =
	"inline-flex h-[30px] min-w-[30px] items-center justify-center px-0 text-[13.5px] leading-none transition-colors";
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
	const block = buildPageBlock(page, totalPages);

	const arrow = (show: boolean, icon: ReactNode, label: string, target: number) =>
		show ? (
			<button
				key={label}
				type="button"
				aria-label={label}
				onClick={() => onPageChange(target)}
				className={ARROW_CLS}
			>
				{icon}
			</button>
		) : (
			<span key={label} aria-hidden className={cn(ARROW_CLS, "invisible")} />
		);

	return (
		<nav
			aria-label="페이지 내비게이션"
			className={cn("flex items-center justify-center gap-1", className)}
		>
			{block.reserveEdge && arrow(block.showFirst, <ChevronsLeft size={15} />, "첫 페이지", 1)}
			{block.reserveStep &&
				arrow(block.showPrev, <ChevronLeft size={15} />, "이전 페이지", page - 1)}
			{block.reserveStep && <span aria-hidden className="w-1.5" />}
			{block.slots.map(({ page: n, exists }) => {
				const hideSm = !isMobilePage(n, page) && "max-sm:hidden";
				if (!exists) {
					return <span key={n} aria-hidden className={cn(CELL_CLS, "invisible", hideSm)} />;
				}
				return (
					<button
						key={n}
						type="button"
						aria-current={n === page ? "page" : undefined}
						onClick={() => onPageChange(n)}
						className={cn(
							CELL_CLS,
							n === page
								? "cursor-default font-bold text-primary"
								: "font-medium text-foreground hover:text-primary",
							hideSm,
						)}
					>
						{n}
					</button>
				);
			})}
			{block.reserveStep && <span aria-hidden className="w-1.5" />}
			{block.reserveStep &&
				arrow(block.showNext, <ChevronRight size={15} />, "다음 페이지", page + 1)}
			{block.reserveEdge &&
				arrow(block.showLast, <ChevronsRight size={15} />, "마지막 페이지", totalPages)}
		</nav>
	);
};
