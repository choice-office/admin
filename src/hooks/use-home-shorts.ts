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
