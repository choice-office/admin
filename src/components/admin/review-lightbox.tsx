import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ReviewImage } from "@/types/database";

// 후기 이미지 크게 보기 — 홈페이지 라이트박스와 같은 조판(태그 위 · 흰 매트 · 인용 아래).
// 관리자에서는 카드를 눌러 마스킹 상태를 확인하는 용도라 좌우 이동은 두지 않는다.
// 로드 전에는 매트가 최소 크기를 유지하며 스피너를 보여준다(빈 흰 사각형이 깜빡이던 문제).

type Props = { review: ReviewImage; onClose: () => void };

export const ReviewLightbox = ({ review, onClose }: Props) => {
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [onClose]);

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="후기 이미지 크게 보기"
			className="fixed inset-0 z-[110] flex items-center justify-center p-5 sm:p-11"
		>
			<button
				type="button"
				aria-label="배경 클릭으로 닫기"
				onClick={onClose}
				className="absolute inset-0 cursor-zoom-out border-none bg-[rgba(34,30,26,0.82)] p-0 backdrop-blur-[3px]"
			/>
			<button
				type="button"
				aria-label="닫기"
				onClick={onClose}
				className="absolute top-4 right-5 z-[2] p-1.5 text-white/85 hover:text-white"
			>
				<X size={26} />
			</button>
			<figure className="relative z-[1] m-0 flex max-h-full flex-col items-center">
				<span className="mb-3 text-center font-semibold text-[12.5px] text-[var(--color-accent)] tracking-[0.04em]">
					{review.tag}
				</span>
				<div
					className={cn(
						"relative flex items-center justify-center border border-white/15 bg-white p-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]",
						loaded ? "min-h-0 min-w-0" : "min-h-[min(46vh,320px)] min-w-[min(72vw,420px)]",
					)}
				>
					{!loaded && (
						<span
							aria-hidden="true"
							className="h-8 w-8 animate-spin rounded-full border-[3px] border-[rgba(34,28,22,0.14)] border-t-[var(--color-primary)] motion-reduce:animate-none"
						/>
					)}
					<img
						src={review.src}
						alt={`${review.tag} 후기 원본`}
						onLoad={() => setLoaded(true)}
						className={cn(
							"h-auto max-h-[78vh] w-auto max-w-[min(94vw,1400px)] object-contain transition-opacity duration-200",
							loaded ? "opacity-100" : "absolute opacity-0",
						)}
					/>
				</div>
				<figcaption className="mt-4 max-w-[640px] break-keep text-center font-medium text-[#f2ece2] text-[14px] leading-relaxed">
					“{review.quote}”
					<span className="mt-1.5 block text-[12.5px] text-[var(--color-accent)]">
						— {review.meta || "익명"}
					</span>
				</figcaption>
			</figure>
		</div>
	);
};
