import Image from "@tiptap/extension-image";
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { type MouseEvent as ReactMouseEvent, useRef } from "react";

// 드래그 핸들로 가로 크기를 조절하는 이미지. width 는 HTML(style)로 직렬화돼 저장된다.
const ResizableImageView = ({ node, updateAttributes, selected, editor }: NodeViewProps) => {
	const imgRef = useRef<HTMLImageElement>(null);
	const width = (node.attrs.width as string | null) ?? null;
	const align = (node.attrs.align as "left" | "center" | "right" | null) ?? "center";
	const editable = editor.isEditable;

	const startResize = (e: ReactMouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const img = imgRef.current;
		if (!img) return;
		const startX = e.clientX;
		const startWidth = img.offsetWidth;
		const onMove = (ev: MouseEvent) => {
			const next = Math.max(80, Math.round(startWidth + (ev.clientX - startX)));
			updateAttributes({ width: `${next}px` });
		};
		const onUp = () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	};

	return (
		<NodeViewWrapper className="manual-img-nv" style={{ textAlign: align }}>
			<span className="manual-img-box" style={{ width: width ?? "fit-content" }}>
				<img
					ref={imgRef}
					src={node.attrs.src}
					alt={node.attrs.alt ?? ""}
					// 네이티브 이미지 드래그 비활성화 — 드래그 시 이미지가 복제되는 버그 방지(위치는 정렬 버튼 사용)
					draggable={false}
					style={{ width: width ?? "auto" }}
					className={selected && editable ? "is-selected" : undefined}
				/>
				{editable && selected && (
					// biome-ignore lint/a11y/noStaticElementInteractions: 리사이즈 드래그 핸들
					<span className="manual-img-handle" onMouseDown={startResize} />
				)}
			</span>
		</NodeViewWrapper>
	);
};

export const ResizableImage = Image.extend({
	// 노드 자체 드래그도 비활성화 — ProseMirror/브라우저 드래그로 인한 이미지 복제 방지
	draggable: false,
	addAttributes() {
		return {
			...this.parent?.(),
			width: {
				default: null,
				parseHTML: (el) => (el as HTMLElement).style.width || el.getAttribute("width") || null,
				renderHTML: (attrs) => (attrs.width ? { style: `width: ${attrs.width}` } : {}),
			},
			// 이미지 가로 위치(좌/중앙/우) — data-align 으로 직렬화
			align: {
				default: null,
				parseHTML: (el) => (el as HTMLElement).getAttribute("data-align") || null,
				renderHTML: (attrs) => (attrs.align ? { "data-align": attrs.align } : {}),
			},
		};
	},
	addNodeView() {
		return ReactNodeViewRenderer(ResizableImageView);
	},
});
