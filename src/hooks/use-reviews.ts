import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Review, ReviewInsert, ReviewUpdate } from "@/types/database";

// 후기 목록 조회 + 생성/수정/삭제. RLS authenticated 정책으로 접근.
export const useReviews = () => {
	const [reviews, setReviews] = useState<Review[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const refetch = useCallback(async () => {
		setIsLoading(true);
		const { data, error } = await supabase
			.from("reviews")
			.select("*")
			.order("sort_order", { ascending: true })
			.order("created_at", { ascending: false });
		if (error) console.error("후기 조회 실패:", error.message);
		else setReviews((data ?? []) as Review[]);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		refetch();
	}, [refetch]);

	const createReview = async (payload: ReviewInsert): Promise<boolean> => {
		const { error } = await supabase.from("reviews").insert(payload);
		if (error) {
			console.error("후기 생성 실패:", error.message);
			return false;
		}
		await refetch();
		return true;
	};

	const updateReview = async (id: string, patch: ReviewUpdate): Promise<boolean> => {
		setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
		const { error } = await supabase.from("reviews").update(patch).eq("id", id);
		if (error) {
			console.error("후기 수정 실패:", error.message);
			await refetch();
			return false;
		}
		return true;
	};

	const deleteReview = async (id: string): Promise<boolean> => {
		setReviews((prev) => prev.filter((r) => r.id !== id));
		const { error } = await supabase.from("reviews").delete().eq("id", id);
		if (error) {
			console.error("후기 삭제 실패:", error.message);
			await refetch();
			return false;
		}
		return true;
	};

	return { reviews, isLoading, refetch, createReview, updateReview, deleteReview };
};
