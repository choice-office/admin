import { mergeAttributes, Node } from "@tiptap/core";
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { ExternalLink, FileArchive, FileText } from "lucide-react";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		fileEmbed: {
			// 첨부파일을 임베드 노드로 삽입
			setFileEmbed: (attrs: { href: string; name: string; mime?: string }) => ReturnType;
		};
	}
}

const isPdf = (name: string, mime: string) => mime === "application/pdf" || /\.pdf$/i.test(name);
const isImage = (mime: string, name: string) =>
	mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(name);

// 첨부파일 임베드 — PDF/이미지는 인라인 미리보기, 그 외는 아이콘+파일명 카드(클릭 시 새 탭).
const FileEmbedView = ({ node }: NodeViewProps) => {
	const href = (node.attrs.href as string) ?? "";
	const name = (node.attrs.name as string) ?? "첨부파일";
	const mime = (node.attrs.mime as string) ?? "";
	const pdf = isPdf(name, mime);
	const image = !pdf && isImage(mime, name);

	return (
		<NodeViewWrapper className="my-3" data-drag-handle>
			<div className="overflow-hidden rounded-lg border bg-card">
				<div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
					{/^application\/(zip|x-zip|x-7z|x-rar)/.test(mime) ||
					/\.(zip|7z|rar|tar|gz)$/i.test(name) ? (
						<FileArchive className="size-4 shrink-0 text-muted-foreground" />
					) : (
						<FileText className="size-4 shrink-0 text-muted-foreground" />
					)}
					<span className="min-w-0 flex-1 truncate font-medium text-sm">{name}</span>
					<a
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
					>
						<ExternalLink className="size-3.5" /> 열기
					</a>
				</div>
				{pdf && <iframe src={href} title={name} className="h-[480px] w-full bg-white" />}
				{image && (
					<a href={href} target="_blank" rel="noopener noreferrer" className="block">
						<img src={href} alt={name} className="mx-auto max-h-[480px] w-auto max-w-full" />
					</a>
				)}
			</div>
		</NodeViewWrapper>
	);
};

export const FileEmbed = Node.create({
	name: "fileEmbed",
	group: "block",
	atom: true,
	draggable: false,
	selectable: true,

	addAttributes() {
		return {
			href: {
				default: "",
				parseHTML: (el) => (el as HTMLElement).getAttribute("data-href") || "",
				renderHTML: (attrs) => (attrs.href ? { "data-href": attrs.href } : {}),
			},
			name: {
				default: "첨부파일",
				parseHTML: (el) => (el as HTMLElement).getAttribute("data-name") || "첨부파일",
				renderHTML: (attrs) => ({ "data-name": attrs.name }),
			},
			mime: {
				default: "",
				parseHTML: (el) => (el as HTMLElement).getAttribute("data-mime") || "",
				renderHTML: (attrs) => (attrs.mime ? { "data-mime": attrs.mime } : {}),
			},
		};
	},

	parseHTML() {
		return [{ tag: "div[data-file-embed]" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["div", mergeAttributes(HTMLAttributes, { "data-file-embed": "" })];
	},

	addCommands() {
		return {
			setFileEmbed:
				(attrs) =>
				({ commands }) =>
					commands.insertContent({ type: this.name, attrs }),
		};
	},

	addNodeView() {
		return ReactNodeViewRenderer(FileEmbedView);
	},
});
