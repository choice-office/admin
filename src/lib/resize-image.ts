// 업로드 전 이미지 축소/압축 — Supabase Storage 용량·전송량 절약 + 홈페이지 로딩 개선.
// 가로 최대폭 초과 시 캔버스로 리샘플, WebP(텍스트 캡처에 유리)로 재인코딩.
// 애니메이션 GIF·SVG·이미 작은 이미지·인코딩 실패는 원본을 그대로 반환(안전).
const MAX_WIDTH = 1600;
const QUALITY = 0.85;

export const resizeImage = async (file: File): Promise<File> => {
	if (
		!file.type.startsWith("image/") ||
		file.type === "image/gif" ||
		file.type === "image/svg+xml"
	) {
		return file;
	}
	try {
		const dataUrl = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(new Error("read failed"));
			reader.readAsDataURL(file);
		});
		const img = await new Promise<HTMLImageElement>((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = () => reject(new Error("decode failed"));
			image.src = dataUrl;
		});
		if (img.width <= MAX_WIDTH) return file; // 이미 충분히 작음

		const scale = MAX_WIDTH / img.width;
		const canvas = document.createElement("canvas");
		canvas.width = MAX_WIDTH;
		canvas.height = Math.round(img.height * scale);
		const ctx = canvas.getContext("2d");
		if (!ctx) return file;
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(resolve, "image/webp", QUALITY);
		});
		if (!blob || blob.size >= file.size) return file; // 압축 이득 없으면 원본

		const base = file.name.replace(/\.[^.]+$/, "") || "image";
		return new File([blob], `${base}.webp`, { type: "image/webp" });
	} catch {
		return file; // 어떤 실패든 원본 업로드(기능 보존)
	}
};
