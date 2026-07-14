import { supabase } from "@/lib/supabase";

// 후기 이미지 업로드 → storage(reviews 버킷) → 공개 URL. 핫링크 깨짐 방지(재호스팅).
export const uploadReviewImage = async (file: File): Promise<string | null> => {
	const ext = file.name.split(".").pop()?.toLowerCase() || "png";
	const rand = crypto.randomUUID().slice(0, 8);
	const path = `uploads/${rand}.${ext}`;
	const { error } = await supabase.storage
		.from("reviews")
		.upload(path, file, { cacheControl: "31536000", upsert: false });
	if (error) {
		console.error("후기 이미지 업로드 실패:", error.message);
		return null;
	}
	const { data } = supabase.storage.from("reviews").getPublicUrl(path);
	return data.publicUrl;
};

// 업로드한 이미지의 원본 픽셀 크기(가로세로 비율 유지용)
export const getImageDimensions = (file: File): Promise<{ w: number; h: number }> =>
	new Promise((resolve) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve({ w: img.naturalWidth, h: img.naturalHeight });
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			resolve({ w: 1000, h: 1000 });
		};
		img.src = url;
	});
