import { createFileRoute } from "@tanstack/react-router";
import { Check, Download, ExternalLink, RotateCcw, Trash2, Video, X } from "lucide-react";
import { useEffect, useState } from "react";
import { HomeFeaturedPosts } from "@/components/admin/home-featured-posts";
import { Button, Card, CardTitle, Input } from "@/components/ui/ds";
import {
	fetchLatestShorts,
	type LatestShort,
	parseYoutubeId,
	SHORT_SLOTS,
	useHomeShorts,
} from "@/hooks/use-home-shorts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/home")({
	component: HomePage,
});

const YOUTUBE_CHANNEL = "https://www.youtube.com/@kvisa1345";

// 홈 노출 관리 — 홈페이지 첫 화면에 무엇이 나갈지 정하는 곳.
// ① "영상으로 보는 비자 정보" 유튜브 쇼츠 4칸(이 파일) ② "비자 정보·소식" 블로그 4칸(HomeFeaturedPosts)
// 홈 그리드가 각각 4칸이라 슬롯 4개를 그대로 보여준다.
// 저장 즉시 반영은 아니고 홈이 60초 ISR 이라 최대 1분 뒤 바뀐다(안내 문구로 명시).
function HomePage() {
	const { slots, isLoading, error, saveSlot } = useHomeShorts();
	// 칸별 입력값(붙여넣은 링크 원문)과 저장 상태
	const [drafts, setDrafts] = useState<Record<number, string>>({});
	const [saving, setSaving] = useState<number | null>(null);
	const [saved, setSaved] = useState<number | null>(null);
	// 최신 쇼츠 고르기 — 목록을 열고 칸을 지정해 클릭 한 번으로 채운다.
	const [latest, setLatest] = useState<LatestShort[] | null>(null);
	const [latestBusy, setLatestBusy] = useState(false);
	const [targetSlot, setTargetSlot] = useState<number>(1);

	// DB 값이 오면 입력창 초기값으로 채운다(링크가 아니라 ID 로 저장돼 있으므로 ID 를 보여준다).
	useEffect(() => {
		if (slots.length === 0) return;
		setDrafts(Object.fromEntries(slots.map((s) => [s.slot, s.youtube_id ?? ""])));
	}, [slots]);

	const handleSave = async (slot: number) => {
		const raw = (drafts[slot] ?? "").trim();
		const id = raw ? parseYoutubeId(raw) : null;
		if (raw && !id) {
			alert(
				"유튜브 링크를 인식하지 못했습니다.\n\n쇼츠 주소를 그대로 붙여넣어 주세요.\n예) https://www.youtube.com/shorts/abcdefghijk",
			);
			return;
		}
		setSaving(slot);
		const ok = await saveSlot(slot, id);
		setSaving(null);
		if (ok) {
			// 링크를 붙여넣었어도 저장된 ID 로 입력창을 정리해 준다(다음에 열었을 때와 같은 모습).
			setDrafts((prev) => ({ ...prev, [slot]: id ?? "" }));
			setSaved(slot);
			window.setTimeout(() => setSaved((s) => (s === slot ? null : s)), 2000);
		}
	};

	const handleClear = async (slot: number) => {
		setDrafts((prev) => ({ ...prev, [slot]: "" }));
		setSaving(slot);
		await saveSlot(slot, null);
		setSaving(null);
	};

	const handleLoadLatest = async () => {
		setLatestBusy(true);
		try {
			setLatest(await fetchLatestShorts());
		} catch (e) {
			alert(`최신 쇼츠를 가져오지 못했습니다.\n\n${e instanceof Error ? e.message : ""}`);
		}
		setLatestBusy(false);
	};

	// 목록에서 고른 영상을 지정한 칸에 바로 저장한다(따로 저장 버튼을 누르지 않아도 되게).
	const handlePick = async (id: string) => {
		setSaving(targetSlot);
		const ok = await saveSlot(targetSlot, id);
		setSaving(null);
		if (ok) {
			setDrafts((prev) => ({ ...prev, [targetSlot]: id }));
			setSaved(targetSlot);
			window.setTimeout(() => setSaved((s) => (s === targetSlot ? null : s)), 2000);
			// 다음 빈 칸으로 자동 이동 — 4칸을 연달아 채우기 편하게.
			setTargetSlot((s) => (s < 4 ? s + 1 : s));
		}
	};

	const isMissingTable = !!error && /home_shorts|does not exist|schema cache/i.test(error);

	return (
		<div className="mx-auto w-full max-w-5xl">
			<div className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="font-bold text-[22px] text-foreground tracking-[-0.01em]">홈 노출</h1>
					<p className="mt-1 text-[13.5px] text-muted-foreground">
						홈에 나가는 유튜브 쇼츠 4칸과 블로그 대표글 4칸을 여기서 정합니다. 바꾸면 홈에
						반영됩니다(최대 1분).
					</p>
				</div>
				<a
					className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
					href={YOUTUBE_CHANNEL}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Video className="h-4 w-4" /> 채널에서 링크 복사 <ExternalLink className="h-3.5 w-3.5" />
				</a>
			</div>

			{isMissingTable && (
				<Card className="mb-4 border-destructive/40 bg-destructive/5">
					<CardTitle className="text-destructive">테이블이 아직 없습니다</CardTitle>
					<p className="mt-1.5 text-[13px] text-muted-foreground">
						Supabase 에 <code className="font-mono">home_shorts</code> 테이블을 먼저 만들어야
						합니다. 마이그레이션 파일: <code className="font-mono">0004_home_shorts.sql</code>
					</p>
				</Card>
			)}

			<Card>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<CardTitle>영상으로 보는 비자 정보 · 4칸</CardTitle>
					<Button variant="outline" size="sm" onClick={handleLoadLatest} disabled={latestBusy}>
						<Download className="mr-1.5 h-3.5 w-3.5" />
						{latestBusy ? "가져오는 중…" : "채널 최신 쇼츠 가져오기"}
					</Button>
				</div>

				{/* 최신 쇼츠 목록 — 넣을 칸을 고른 뒤 영상을 클릭하면 그 칸에 바로 저장된다. */}
				{latest && (
					<div className="mt-3 rounded-md border border-border bg-muted/40 p-2.5">
						<div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
							<span className="font-semibold text-[13px] text-foreground">
								최신 쇼츠 {latest.length}개
							</span>
							{/* 유튜브 공개 RSS 는 최근 업로드 15개까지만 준다 — 그보다 예전 영상은 목록에 없다. */}
							<span className="text-[12px] text-muted-foreground">
								최근 업로드 15개까지 · 더 예전 영상은 링크를 붙여넣어 주세요
							</span>
							<div className="flex items-center gap-1">
								<span className="text-[12.5px] text-muted-foreground">넣을 칸</span>
								{SHORT_SLOTS.map((s) => (
									<button
										key={s}
										type="button"
										onClick={() => setTargetSlot(s)}
										className={cn(
											"h-6 w-6 rounded text-[12px] transition-colors",
											targetSlot === s
												? "bg-accent font-bold text-accent-foreground"
												: "text-muted-foreground hover:bg-muted",
										)}
									>
										{s}
									</button>
								))}
							</div>
							<button
								type="button"
								className="ml-auto text-muted-foreground hover:text-foreground"
								onClick={() => setLatest(null)}
								title="목록 닫기"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
						{latest.length === 0 ? (
							<p className="px-0.5 py-2 text-[12.5px] text-muted-foreground">
								쇼츠를 찾지 못했습니다.
							</p>
						) : (
							<div className="grid max-h-[340px] grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6 lg:grid-cols-8">
								{latest.map((v) => (
									<button
										key={v.id}
										type="button"
										onClick={() => handlePick(v.id)}
										title={v.title}
										className="group overflow-hidden rounded border border-border bg-background text-left transition-colors hover:border-accent"
									>
										<div className="relative aspect-[9/16] overflow-hidden">
											<img
												src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
												alt={v.title}
												className="h-full w-full object-cover"
											/>
										</div>
										<div className="line-clamp-2 p-1 text-[11px] text-muted-foreground leading-snug group-hover:text-foreground">
											{v.title}
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				)}

				<div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{SHORT_SLOTS.map((slot) => {
						const row = slots.find((s) => s.slot === slot);
						const draft = drafts[slot] ?? "";
						const id = parseYoutubeId(draft);
						const dirty = (row?.youtube_id ?? "") !== (id ?? "");
						return (
							<div
								key={slot}
								className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-2.5"
							>
								<div className="flex items-center justify-between">
									<span className="font-semibold text-[12.5px] text-muted-foreground">
										{slot}번 칸
									</span>
									{row?.youtube_id && (
										<button
											type="button"
											className="text-muted-foreground hover:text-destructive"
											title="이 칸 비우기"
											onClick={() => handleClear(slot)}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									)}
								</div>

								{/* 미리보기 — 쇼츠는 9:16 이라 세로 비율로 둔다. 썸네일은 유튜브 기본 이미지. */}
								<div className="relative aspect-[9/16] overflow-hidden rounded border border-border bg-background">
									{id ? (
										<img
											src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
											alt={`${slot}번 칸 미리보기`}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center text-[12px] text-muted-foreground">
											{isLoading ? "불러오는 중…" : "비어 있음"}
										</div>
									)}
								</div>

								<Input
									value={draft}
									onChange={(e) => setDrafts((prev) => ({ ...prev, [slot]: e.target.value }))}
									placeholder="쇼츠 링크 붙여넣기"
									className="text-[12.5px]"
								/>

								<div className="flex items-center gap-1.5">
									<Button
										size="sm"
										className="flex-1"
										disabled={saving === slot || !dirty}
										onClick={() => handleSave(slot)}
									>
										{saving === slot ? "저장 중…" : saved === slot ? "저장됨" : "저장"}
									</Button>
									{dirty && (
										<Button
											variant="ghost"
											size="sm"
											title="입력 취소"
											onClick={() =>
												setDrafts((prev) => ({ ...prev, [slot]: row?.youtube_id ?? "" }))
											}
										>
											<RotateCcw className="h-3.5 w-3.5" />
										</Button>
									)}
								</div>

								{id && (
									<a
										className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground"
										href={`https://www.youtube.com/shorts/${id}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										영상 확인 <ExternalLink className="h-3 w-3" />
									</a>
								)}
							</div>
						);
					})}
				</div>

				<p
					className={cn(
						"mt-3.5 flex items-start gap-1.5 text-[12.5px] text-muted-foreground",
						saved && "text-foreground",
					)}
				>
					<Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
					<span>
						칸을 비우면 홈에서 그 자리를 건너뜁니다. 4칸 모두 비우면 이전 기본 영상이 나갑니다.
					</span>
				</p>
			</Card>

			<HomeFeaturedPosts />
		</div>
	);
}
