import { Card } from "@/components/ui/ds";

// 단계적 구현용 임시 화면. 각 화면 구현 시 교체된다.
export const ScreenPlaceholder = ({ title, desc }: { title: string; desc: string }) => (
	<div className="max-w-[1180px]">
		<div className="mb-5">
			<h2 className="m-0 mb-1.5 font-bold text-2xl text-foreground tracking-[-0.02em]">{title}</h2>
			<p className="m-0 text-[15px] text-muted-foreground">{desc}</p>
		</div>
		<Card className="p-12">
			<div className="text-center text-[15px] text-muted-foreground">화면 준비 중입니다.</div>
		</Card>
	</div>
);
