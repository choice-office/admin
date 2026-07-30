import { FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button } from "@/components/ui/ds";
import {
	DRAFT_RETENTION_DAYS,
	draftDaysLeft,
	listDraftPosts,
	purgeExpiredDrafts,
} from "@/lib/blog";
import { formatDateCompact } from "@/lib/format";
import type { BlogPost } from "@/types/database";

type Props = {
	currentPostId?: string; // 지금 편집 중인 글 — 목록에서 "편집 중"으로 표시
	onClose: () => void;
	onOpen: (postId: string) => void; // 이어서 작성
};

// 임시저장 목록 모달 — 열 때 만료분을 먼저 정리한 뒤 남은 글만 보여준다.
export const DraftListModal = ({ currentPostId, onClose, onOpen }: Props) => {
	const [drafts, setDrafts] = useState<BlogPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isAlive = true;
		const load = async () => {
			await purgeExpiredDrafts();
			const list = await listDraftPosts();
			if (!isAlive) return;
			setDrafts(list);
			setIsLoading(false);
		};
		load();
		return () => {
			isAlive = false;
		};
	}, []);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [onClose]);

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="임시저장 목록"
			className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
		>
			<button
				type="button"
				aria-label="배경 클릭으로 닫기"
				onClick={onClose}
				className="absolute inset-0 cursor-default border-none bg-[rgba(34,29,22,0.45)] p-0"
			/>
			<div className="relative z-[1] flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-md)]">
				<div className="flex items-start justify-between gap-3 border-border border-b px-4 py-4 sm:px-6 sm:py-5">
					<div>
						<h3 className="m-0 font-bold text-foreground text-xl tracking-[-0.02em]">
							임시저장 목록
						</h3>
						<p className="m-0 mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
							임시저장 글은 마지막 저장일로부터 {DRAFT_RETENTION_DAYS}일간 보관되고, 이후 자동
							삭제됩니다.
						</p>
					</div>
					<button
						type="button"
						aria-label="닫기"
						onClick={onClose}
						className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
					>
						<X size={18} />
					</button>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto">
					{isLoading ? (
						<div className="px-5 py-14 text-center text-muted-foreground text-sm">불러오는 중…</div>
					) : drafts.length === 0 ? (
						<div className="px-5 py-14 text-center">
							<div className="font-medium text-[15px] text-foreground">
								임시저장된 글이 없습니다
							</div>
							<div className="mt-1.5 text-muted-foreground text-sm">
								작성 중인 글은 "임시저장"으로 보관해 두세요.
							</div>
						</div>
					) : (
						drafts.map((d) => {
							const isCurrent = d.id === currentPostId;
							const daysLeft = draftDaysLeft(d.updated_at);
							return (
								<div
									key={d.id}
									className="flex items-center gap-3 border-border border-b px-4 py-3.5 last:border-b-0 sm:px-6"
								>
									<span className="flex shrink-0 text-muted-foreground">
										<FileText size={17} />
									</span>
									<div className="min-w-0 flex-1">
										<div className="truncate font-medium text-[15px] text-foreground">
											{d.title || "(제목 없음)"}
										</div>
										<div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted-foreground">
											<span>{formatDateCompact(d.updated_at)} 저장</span>
											<span aria-hidden>·</span>
											<span className={daysLeft <= 3 ? "font-semibold text-destructive" : ""}>
												{daysLeft}일 남음
											</span>
										</div>
									</div>
									{isCurrent ? (
										<Badge variant="outline">편집 중</Badge>
									) : (
										<Button variant="outline" onClick={() => onOpen(d.id)}>
											이어서 작성
										</Button>
									)}
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
};
