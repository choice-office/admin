import { AlertTriangle, Download, ExternalLink, Pin, RotateCcw, Video } from "lucide-react";
import { useState } from "react";
import { ShortPickerModal } from "@/components/admin/short-picker-modal";
import { Badge, Button, Card, CardTitle } from "@/components/ui/ds";
import {
	isPlaceholderThumbnail,
	refreshShortsLibrary,
	SHORT_SLOTS,
	shortsUrl,
	thumbnailUrl,
	useHomeShorts,
	useShortsLibrary,
} from "@/hooks/use-home-shorts";
import { cn } from "@/lib/utils";

// 홈 "영상으로 보는 비자 정보" 4칸 관리.
//
// 구조: 보관함(youtube_shorts) 에서 골라 4칸(home_shorts) 에 배정한다.
//   · [보관함 갱신] — 채널 최신 목록을 받아 **이미 있는 건 건너뛰고 새것만** DB 에 추가
//   · 칸의 [선택하기] — 그 칸에 넣을 쇼츠를 보관함에서 고르는 모달(칸에서 시작하니 헷갈리지 않는다)
// 홈 반영은 ISR 60초. 스키마: choice-homepage/supabase/migrations/0004·0006

const YOUTUBE_CHANNEL = "https://www.youtube.com/@kvisa1345";

export const HomeShorts = () => {
	const { slots, isLoading, error, saveSlot } = useHomeShorts();
	const { items, refetch: refetchLibrary } = useShortsLibrary();
	const [busySlot, setBusySlot] = useState<number | null>(null);
	const [pickerSlot, setPickerSlot] = useState<number | null>(null);
	const [refreshing, setRefreshing] = useState(false);
	// 썸네일이 대체 이미지로 뜬 ID — 영상이 삭제·비공개로 바뀐 경우. 칸에 경고를 덮는다.
	const [badIds, setBadIds] = useState<string[]>([]);

	const isMissingTable = !!error && /home_shorts|does not exist|schema cache/i.test(error);

	// 보관함 제목 조회용 — 칸에는 ID 만 저장돼 있어 제목은 보관함에서 찾는다.
	const titleOf = (id: string) => items.find((v) => v.youtube_id === id)?.title ?? "";
	// youtubeId → 칸 번호. 모달에서 "홈 3" 배지로 보여준다.
	const usedSlots = new Map(
		slots.filter((s) => s.youtube_id).map((s) => [s.youtube_id as string, s.slot] as const),
	);

	// 홈은 **항상 4칸을 채운다** — 지정하지 않은 칸은 보관함 최신순으로 자동으로 들어간다.
	// (공개 렌더 lib/home-shorts.ts 와 같은 규칙) 그래서 빈 칸에도 "실제로 나갈 영상"을 보여준다.
	const pinnedIds = new Set(slots.map((s) => s.youtube_id).filter((v): v is string => !!v));
	const autoQueue = items.map((v) => v.youtube_id).filter((id) => !pinnedIds.has(id));
	let autoIndex = 0;
	const resolved = SHORT_SLOTS.map((slot) => {
		const pinnedId = slots.find((s) => s.slot === slot)?.youtube_id ?? null;
		if (pinnedId) return { slot, id: pinnedId, isPinned: true as const };
		const auto = autoQueue[autoIndex];
		autoIndex += 1;
		return { slot, id: auto ?? null, isPinned: false as const };
	});
	const pinnedCount = pinnedIds.size;

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			const added = await refreshShortsLibrary();
			await refetchLibrary();
			alert(
				added > 0
					? `새 쇼츠 ${added}개를 보관함에 추가했습니다.`
					: "새로 올라온 쇼츠가 없습니다.\n보관함이 이미 최신입니다.",
			);
		} catch (e) {
			alert(`보관함을 갱신하지 못했습니다.\n\n${e instanceof Error ? e.message : ""}`);
		}
		setRefreshing(false);
	};

	const handlePick = async (id: string, _title: string) => {
		const slot = pickerSlot;
		setPickerSlot(null);
		if (!slot) return;
		setBusySlot(slot);
		const ok = await saveSlot(slot, id);
		setBusySlot(null);
		if (!ok) alert("칸에 넣지 못했습니다. 잠시 후 다시 시도해 주세요.");
	};

	const handleClear = async (slot: number) => {
		setBusySlot(slot);
		const ok = await saveSlot(slot, null);
		setBusySlot(null);
		if (!ok) alert("칸을 비우지 못했습니다. 잠시 후 다시 시도해 주세요.");
	};

	return (
		<Card>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<CardTitle>영상으로 보는 비자 정보 · 4칸</CardTitle>
				<div className="flex items-center gap-2">
					<a
						className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
						href={YOUTUBE_CHANNEL}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Video className="h-4 w-4" /> 채널 열기 <ExternalLink className="h-3.5 w-3.5" />
					</a>
					<Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
						<Download className="mr-1.5 h-3.5 w-3.5" />
						{refreshing ? "갱신 중…" : "보관함 갱신"}
					</Button>
				</div>
			</div>
			<p className="mt-1.5 text-[12.5px] text-muted-foreground">
				보관함 {items.length}개 중에서 골라 홈 4칸에 넣습니다.{" "}
				<b className="text-foreground">홈에는 항상 4개가 나갑니다</b> — 지정하지 않은 칸은 보관함
				최신순으로 자동으로 채워집니다.
				{pinnedCount > 0
					? ` (지금 ${pinnedCount}칸 지정 · ${4 - pinnedCount}칸 자동)`
					: " (지금 4칸 모두 자동)"}
			</p>

			{isMissingTable && (
				<div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5">
					<p className="m-0 font-semibold text-[13px] text-destructive">테이블이 아직 없습니다</p>
					<p className="m-0 mt-1 text-[12.5px] text-muted-foreground">
						마이그레이션을 먼저 적용해 주세요:{" "}
						<code className="font-mono">0004_home_shorts.sql</code> ·{" "}
						<code className="font-mono">0006_youtube_shorts.sql</code>
					</p>
				</div>
			)}

			<div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{resolved.map(({ slot, id, isPinned }) => {
					const bad = !!id && badIds.includes(id);
					return (
						<div
							key={slot}
							className={cn(
								"flex flex-col gap-2 rounded-md p-2.5",
								isPinned
									? "border border-border bg-muted/30"
									: "border border-border border-dashed bg-transparent",
							)}
						>
							<div className="flex items-center justify-between gap-1">
								{/* 칸 번호를 눈에 띄게 — 어느 자리를 다루는지가 이 화면의 핵심 정보다. */}
								<span className="flex h-6 min-w-6 items-center justify-center rounded bg-accent px-1.5 font-bold text-[12.5px] text-accent-foreground">
									{slot}
								</span>
								{isPinned ? (
									<Badge variant="outline">
										<Pin size={11} className="mr-1" />
										지정
									</Badge>
								) : (
									<span className="text-[11.5px] text-muted-foreground">자동</span>
								)}
							</div>

							{/* 미리보기 — 쇼츠는 9:16 세로. 홈 카드와 같은 썸네일(oardefault)을 쓴다.
							    자동 칸은 흐리게 = "지금 그 자리에 나가는 영상"이라는 뜻. */}
							<div
								className={cn(
									"relative aspect-[9/16] overflow-hidden rounded border border-border bg-background",
									!isPinned && "opacity-60",
								)}
							>
								{id ? (
									<img
										key={id}
										src={thumbnailUrl(id)}
										alt={`${slot}번 칸 미리보기`}
										className="h-full w-full object-cover"
										onLoad={(e) => {
											// 404 여도 회색 대체 이미지가 실려 와 onLoad 가 뜬다 → 크기로 구분한다.
											const isBad = isPlaceholderThumbnail(e.currentTarget);
											setBadIds((prev) =>
												isBad
													? prev.includes(id)
														? prev
														: [...prev, id]
													: prev.filter((v) => v !== id),
											);
										}}
										onError={() => setBadIds((prev) => (prev.includes(id) ? prev : [...prev, id]))}
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center px-2 text-center text-[12px] text-muted-foreground">
										{isLoading ? "불러오는 중…" : "보관함에 쇼츠가 부족합니다"}
									</div>
								)}
								{bad && (
									<div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/10 px-2 text-center font-semibold text-[12px] text-destructive">
										<AlertTriangle className="h-4 w-4" />
										영상을 찾을 수 없음
									</div>
								)}
							</div>

							<span
								className={cn(
									"line-clamp-2 min-h-[34px] break-keep text-[12.5px] leading-snug",
									isPinned ? "font-medium text-foreground" : "text-muted-foreground",
								)}
							>
								{id ? titleOf(id) || "(제목 없음)" : ""}
							</span>

							<div className="flex items-center gap-1.5">
								<Button
									size="sm"
									className="flex-1"
									disabled={busySlot !== null}
									onClick={() => setPickerSlot(slot)}
								>
									{busySlot === slot ? "저장 중…" : isPinned ? "바꾸기" : "지정하기"}
								</Button>
								{isPinned && (
									<Button
										variant="ghost"
										size="sm"
										title="이 칸을 자동으로 되돌리기"
										disabled={busySlot !== null}
										onClick={() => handleClear(slot)}
									>
										<RotateCcw className="h-3.5 w-3.5" />
									</Button>
								)}
							</div>

							{id && (
								<a
									className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground"
									href={shortsUrl(id)}
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

			<p className="mt-3.5 text-[12.5px] text-muted-foreground">
				자동 칸은 채널에 새 쇼츠가 올라오면 그 영상으로 바뀝니다. 지정한 칸은 바꿀 때까지 그대로
				유지됩니다. 홈 반영은 최대 1분.
			</p>

			{pickerSlot !== null && (
				<ShortPickerModal
					slot={pickerSlot}
					items={items}
					usedSlots={usedSlots}
					onClose={() => setPickerSlot(null)}
					onPick={handlePick}
					onLibraryChange={refetchLibrary}
				/>
			)}
		</Card>
	);
};
