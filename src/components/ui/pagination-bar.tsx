import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildPageList } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type PaginationBarProps = {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	className?: string;
};

// 관리자 공용 페이지네이션 — 양옆 화살표 + 현재 페이지 주변(±1)/처음·끝만 노출(나머지 "…").
// 페이지 목록 규칙은 buildPageList(공개 블로그와 동일)에 위임한다.
export const PaginationBar = ({
	page,
	totalPages,
	onPageChange,
	className,
}: PaginationBarProps) => {
	const items = buildPageList(page, totalPages);
	const prevDisabled = page <= 1;
	const nextDisabled = page >= totalPages;
	const arrowCls =
		"flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40";

	return (
		<nav
			aria-label="페이지 내비게이션"
			className={cn("flex items-center justify-center gap-1.5", className)}
		>
			<button
				type="button"
				aria-label="이전 페이지"
				disabled={prevDisabled}
				onClick={() => onPageChange(page - 1)}
				className={arrowCls}
			>
				<ChevronLeft size={18} />
			</button>
			{items.map((item, i) =>
				item === "…" ? (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: "…" 위치는 정적 목록 인덱스로 안정적
						key={`gap-${i}`}
						aria-hidden
						className="flex h-9 min-w-9 items-center justify-center text-muted-foreground text-sm"
					>
						…
					</span>
				) : (
					<button
						key={item}
						type="button"
						aria-current={item === page ? "page" : undefined}
						onClick={() => onPageChange(item)}
						className={cn(
							"flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm transition-colors",
							item === page
								? "border-primary bg-primary font-bold text-primary-foreground"
								: "border-border bg-card font-medium text-foreground hover:bg-muted",
						)}
					>
						{item}
					</button>
				),
			)}
			<button
				type="button"
				aria-label="다음 페이지"
				disabled={nextDisabled}
				onClick={() => onPageChange(page + 1)}
				className={arrowCls}
			>
				<ChevronRight size={18} />
			</button>
		</nav>
	);
};
