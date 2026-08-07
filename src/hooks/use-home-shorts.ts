import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { HomeShort } from "@/types/database";

// 홈 "영상으로 보는 비자 정보" 4칸 조회·수정. RLS authenticated 정책으로 접근.
// 슬롯(1~4)은 마이그레이션에서 미리 만들어져 있어 update 만 한다(insert/delete 없음).
// 스키마: choice-homepage/supabase/migrations/0004_home_shorts.sql

export const SHORT_SLOTS = [1, 2, 3, 4] as const;

/** 유튜브 링크/ID 에서 11자 영상 ID 추출. 실패 시 null.
 *  지원: youtube.com/shorts/ID · youtu.be/ID · watch?v=ID · embed/ID · ID 직접 입력 */
export const parseYoutubeId = (input: string): string | null => {
	const s = input.trim();
	if (!s) return null;
	if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
	const m = s.match(/(?:shorts\/|youtu\.be\/|[?&]v=|embed\/|live\/)([A-Za-z0-9_-]{11})/);
	return m ? m[1] : null;
};

/** 칸에 보여줄 주소 — 저장은 11자 ID 로 하지만 화면에는 붙여넣은 것과 같은 형태로 보여준다. */
export const shortsUrl = (id: string): string => `https://www.youtube.com/shorts/${id}`;

// ★ i.ytimg.com 은 없는 영상에도 404 와 **함께 120×90 회색 대체 이미지**를 보낸다.
//   그래서 <img> 의 onerror 는 안 뜨고 onload 가 뜬다 — "이미지가 로드됐으니 영상이 있다"는
//   판정은 틀린다. 실제 썸네일은 훨씬 크므로 크기로 구분할 수 있다.
const PLACEHOLDER_MAX_WIDTH = 120;

// oardefault = 세로(9:16) 원본 썸네일. **쇼츠에만 존재하고 일반 영상은 404** 이며,
// 홈페이지 카드가 쓰는 것과 같은 이미지다. 따라서 이걸로 확인하면
// "없는 영상"과 "쇼츠가 아닌 일반 영상"을 한 번에 걸러내고, 미리보기도 홈과 똑같이 보인다.
export const thumbnailUrl = (id: string): string => `https://i.ytimg.com/vi/${id}/oardefault.jpg`;

/** 로드된 썸네일이 "없는 영상" 대체 이미지인지 — 미리보기에서 즉시 경고를 띄우는 데 쓴다. */
export const isPlaceholderThumbnail = (img: HTMLImageElement): boolean =>
	img.naturalWidth <= PLACEHOLDER_MAX_WIDTH;

/** 썸네일이 있는지 = 쇼츠로서 존재하는지.
 *  1순위: fetch 상태코드(i.ytimg.com 은 CORS 를 허용해 404 를 그대로 읽을 수 있다).
 *  2순위: CSP·네트워크로 fetch 가 막히면 대체 이미지 크기로 판정.
 *  둘 다 실패하면 통과시킨다 — 정상 저장을 막는 쪽이 더 나쁘다. */
const hasShortThumbnail = async (id: string): Promise<boolean> => {
	try {
		const res = await fetch(thumbnailUrl(id), { cache: "no-store" });
		return res.ok;
	} catch {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => resolve(!isPlaceholderThumbnail(img));
			img.onerror = () => resolve(true);
			img.src = thumbnailUrl(id);
		});
	}
};

// oEmbed — API 키 없이 "홈에 임베드해서 재생할 수 있는가"를 유튜브가 직접 답해 준다.
//   200 = 임베드 가능(제목도 함께 옴) · 401 = 퍼가기 차단·비공개 · 400/404 = 없는 영상
// 썸네일만으로는 이걸 알 수 없다: 퍼가기를 막은 영상도 썸네일은 그대로 있어서
// 홈에 카드가 나가고 눌렀을 때만 "동영상을 재생할 수 없음" 이 뜬다.
// CORS 는 허용돼 있어 어드민 브라우저에서 바로 부를 수 있다.
const oembedUrl = (id: string) =>
	`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;

type Embeddable = { title: string } | "blocked" | "notfound" | "unknown";

const fetchEmbedInfo = async (id: string): Promise<Embeddable> => {
	try {
		const res = await fetch(oembedUrl(id), { cache: "no-store" });
		if (res.status === 401 || res.status === 403) return "blocked";
		if (!res.ok) return "notfound";
		const data = (await res.json()) as { title?: string };
		return { title: (data.title ?? "").trim() };
	} catch {
		// 네트워크·CORS 로 확인 불가 → 막지 않는다(정상 저장을 실패시키는 게 더 나쁘다).
		return "unknown";
	}
};

export type ShortCheck =
	| { ok: true; title: string }
	| { ok: false; reason: "notfound" | "blocked" | "notshort" };

/** 홈에 걸 수 있는 쇼츠인지 종합 확인 — ① 존재 ② 임베드 재생 가능 ③ 쇼츠(세로).
 *  ID 를 한 글자만 잘못 고쳐도 11자 형식은 그대로라 검사 없이는 저장이 통과해 버리고,
 *  홈에서 그 칸만 조용히 빈다. 저장 전에 여기서 막는다. */
export const checkShort = async (id: string): Promise<ShortCheck> => {
	const [info, isShort] = await Promise.all([fetchEmbedInfo(id), hasShortThumbnail(id)]);
	if (info === "blocked") return { ok: false, reason: "blocked" };
	if (info === "notfound") return { ok: false, reason: "notfound" };
	// 임베드는 되는데 세로 썸네일이 없으면 쇼츠가 아니다(일반 가로 영상).
	if (!isShort) return { ok: false, reason: "notshort" };
	return { ok: true, title: info === "unknown" ? "" : info.title };
};

export type LatestShort = { id: string; title: string; published: string };

// 채널 최신 쇼츠 가져오기 — 홈페이지 API(/api/youtube/shorts)를 거친다.
// 브라우저에서 유튜브 RSS 를 직접 못 부르기 때문(CORS). API 키는 쓰지 않는다.
export const fetchLatestShorts = async (): Promise<LatestShort[]> => {
	const base =
		(import.meta.env.VITE_SITE_API_BASE as string | undefined) ?? "https://kvisa1345.com";
	const res = await fetch(`${base.replace(/\/$/, "")}/api/youtube/shorts`);
	if (!res.ok) throw new Error(`목록을 가져오지 못했습니다 (${res.status})`);
	const data = (await res.json()) as { items?: LatestShort[]; error?: string };
	if (data.error) throw new Error(data.error);
	return data.items ?? [];
};

export const useHomeShorts = () => {
	const [slots, setSlots] = useState<HomeShort[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	// 테이블이 아직 없으면(마이그레이션 미적용) 화면에서 안내해야 하므로 오류 메시지를 들고 있는다.
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(async () => {
		setIsLoading(true);
		const { data, error: e } = await supabase
			.from("home_shorts")
			.select("*")
			.order("slot", { ascending: true });
		if (e) setError(e.message);
		else {
			setError(null);
			setSlots((data ?? []) as HomeShort[]);
		}
		setIsLoading(false);
	}, []);

	useEffect(() => {
		refetch();
	}, [refetch]);

	/** 한 칸 저장 — youtubeId 가 null 이면 칸을 비운다(홈은 그 칸을 건너뛴다). */
	const saveSlot = async (slot: number, youtubeId: string | null): Promise<boolean> => {
		setSlots((prev) => prev.map((s) => (s.slot === slot ? { ...s, youtube_id: youtubeId } : s)));
		const { error: e } = await supabase
			.from("home_shorts")
			.update({ youtube_id: youtubeId })
			.eq("slot", slot);
		if (e) {
			console.error("쇼츠 저장 실패:", e.message);
			setError(e.message);
			await refetch();
			return false;
		}
		setError(null);
		return true;
	};

	return { slots, isLoading, error, saveSlot, refetch };
};
