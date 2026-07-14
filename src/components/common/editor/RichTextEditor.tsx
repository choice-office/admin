import { TaskItem, TaskList } from "@tiptap/extension-list";
import TextAlign from "@tiptap/extension-text-align";
import { BackgroundColor, Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	AlignVerticalSpaceAround,
	Ban,
	Baseline,
	Bold,
	Code,
	ExternalLink,
	Highlighter,
	ImageIcon,
	IndentDecrease,
	IndentIncrease,
	Italic,
	Link2,
	List,
	ListChecks,
	ListOrdered,
	Minus,
	Paperclip,
	Plus,
	Quote,
	Redo2,
	RemoveFormatting,
	Strikethrough,
	Trash2,
	Underline as UnderlineIcon,
	Undo2,
} from "lucide-react";
import {
	type ChangeEvent,
	type Ref,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { FileEmbed } from "./FileEmbed";
import { Indent } from "./Indent";
import { LineHeight } from "./LineHeight";
import { ResizableImage } from "./ResizableImage";

export type RichTextEditorHandle = { getHTML: () => string };

export type UploadedFile = { url: string; name: string; mime: string };

type RichTextEditorProps = {
	content: string;
	editable: boolean;
	placeholder?: string;
	// 본문 이미지 업로드 → public URL 반환. 없으면 사진 버튼·붙여넣기/드롭 비활성.
	uploadImage?: (file: File) => Promise<string>;
	// 첨부파일 업로드 → { url, name, mime }. 없으면 첨부 버튼 비활성.
	uploadFile?: (file: File) => Promise<UploadedFile>;
	// 본문 변경 시 최신 HTML 통지 — 라이브 미리보기 등에 사용
	onChange?: (html: string) => void;
	ref?: Ref<RichTextEditorHandle>;
};

const imagesFromList = (files?: FileList | null): File[] =>
	files ? Array.from(files).filter((f) => f.type.startsWith("image/")) : [];

const Divider = () => <span className="mx-1 h-5 w-px self-center bg-border" />;

// 글자 색상 팔레트 (Ban 버튼 = 색 해제)
const TEXT_COLORS = [
	{ label: "검정", value: "#111827" },
	{ label: "회색", value: "#6b7280" },
	{ label: "빨강", value: "#ef4444" },
	{ label: "주황", value: "#f97316" },
	{ label: "노랑", value: "#eab308" },
	{ label: "초록", value: "#22c55e" },
	{ label: "파랑", value: "#3b82f6" },
	{ label: "파랑(진)", value: "#2563eb" },
	{ label: "보라", value: "#8b5cf6" },
	{ label: "분홍", value: "#ec4899" },
];

// 형광펜(글자 배경) 팔레트 (Ban 버튼 = 해제)
const HIGHLIGHT_COLORS = [
	{ label: "노랑", value: "#fef08a" },
	{ label: "초록", value: "#bbf7d0" },
	{ label: "파랑", value: "#bfdbfe" },
	{ label: "분홍", value: "#fbcfe8" },
	{ label: "주황", value: "#fed7aa" },
	{ label: "보라", value: "#e9d5ff" },
	{ label: "회색", value: "#e5e7eb" },
];

// 줄 간격 프리셋
const LINE_HEIGHTS = ["1", "1.15", "1.5", "2", "2.5"];

const MIN_FONT_PX = 8;
const MAX_FONT_PX = 120;
const DEFAULT_FONT_PX = 15; // 본문 기본 크기(0.95rem ≈ 15px)

// 링크 URL 정규화 — 스킴 없으면 https:// 보정(naver.com → https://naver.com), 이메일은 mailto:
const normalizeUrl = (raw: string): string | null => {
	const v = raw.trim();
	if (!v) return null;
	if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
	if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
	return `https://${v}`;
};

// 블로그 본문 리치 텍스트 에디터 (Tiptap). 업로드 동작은 props 로 주입(피처별 저장소 분리).
export const RichTextEditor = ({
	content,
	editable,
	placeholder,
	uploadImage,
	uploadFile,
	onChange,
	ref,
}: RichTextEditorProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const attachInputRef = useRef<HTMLInputElement>(null);
	const sizeInputRef = useRef<HTMLInputElement>(null);
	const linkInputRef = useRef<HTMLInputElement>(null);
	const editorRef = useRef<Editor | null>(null);
	const uploadingRef = useRef(false);
	const [uploading, setUploading] = useState(false);
	const [linkOpen, setLinkOpen] = useState(false);
	// 링크 hover 미리보기 카드 (URL 노출 + 새 탭 열기)
	const [linkHover, setLinkHover] = useState<{ href: string; x: number; y: number } | null>(null);

	// 업로드 콜백을 ref 로 — editorProps 핸들러(최초 1회 생성) 클로저 stale 방지
	const uploadImageRef = useRef(uploadImage);
	uploadImageRef.current = uploadImage;
	const uploadFileRef = useRef(uploadFile);
	uploadFileRef.current = uploadFile;

	// 여러 장 업로드 — 선택/붙여넣기/드롭한 순서대로 차례로 올려 본문에 삽입
	const uploadAndInsertMany = async (files: File[]) => {
		const up = uploadImageRef.current;
		if (!up || !files.length || uploadingRef.current) return;
		uploadingRef.current = true;
		setUploading(true);
		try {
			for (const file of files) {
				const url = await up(file);
				editorRef.current?.chain().focus().setImage({ src: url }).run();
			}
		} catch {
			toast.error("이미지 업로드에 실패했습니다.");
		} finally {
			uploadingRef.current = false;
			setUploading(false);
		}
	};

	// 여러 첨부파일 업로드 — 각 파일을 올리고 본문에 다운로드 링크(📎 파일명)로 삽입
	const attachAndInsertMany = async (files: File[]) => {
		const up = uploadFileRef.current;
		if (!up || !files.length || uploadingRef.current) return;
		uploadingRef.current = true;
		setUploading(true);
		try {
			for (const file of files) {
				const { url, name, mime } = await up(file);
				editorRef.current?.chain().focus().setFileEmbed({ href: url, name, mime }).run();
			}
		} catch {
			toast.error("파일 첨부에 실패했습니다.");
		} finally {
			uploadingRef.current = false;
			setUploading(false);
		}
	};

	const editor = useEditor({
		// 선택/트랜잭션마다 리렌더 — 툴바의 isActive(이미지 선택, 굵게, 색상 등) 상태를 항상 최신으로
		shouldRerenderOnTransaction: true,
		extensions: [
			StarterKit.configure({ link: { openOnClick: "whenNotEditable" } }),
			ResizableImage.configure({ inline: false, allowBase64: true }),
			FileEmbed,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			TextStyle,
			Color,
			BackgroundColor,
			FontSize,
			LineHeight,
			Indent,
			TaskList,
			TaskItem.configure({ nested: true }),
			...(editable && placeholder ? [Placeholder.configure({ placeholder })] : []),
		],
		content: content ?? "",
		editable,
		onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
		editorProps: {
			attributes: { class: "rich-content min-h-[420px] focus:outline-none" },
			handlePaste: (_view, event) => {
				if (!uploadImageRef.current) return false;
				const files = imagesFromList(event.clipboardData?.files);
				if (!files.length) return false;
				void uploadAndInsertMany(files);
				return true;
			},
			handleDrop: (_view, event) => {
				if (!uploadImageRef.current) return false;
				const files = imagesFromList(event.dataTransfer?.files);
				if (!files.length) return false;
				event.preventDefault();
				void uploadAndInsertMany(files);
				return true;
			},
		},
	});
	editorRef.current = editor;

	// 저장 시점에 부모가 현재 HTML 을 읽어가도록 노출
	useImperativeHandle(ref, () => ({ getHTML: () => editor?.getHTML() ?? "" }), [editor]);

	// 본문 링크 hover → URL 미리보기 카드 (editor DOM 에 직접 리스너 — JSX a11y 회피)
	useEffect(() => {
		if (!editor) return;
		const dom = editor.view.dom;
		const show = (e: Event) => {
			const a = (e.target as HTMLElement).closest?.("a");
			if (!a) return;
			const r = a.getBoundingClientRect();
			setLinkHover({ href: a.getAttribute("href") ?? "", x: r.left, y: r.bottom });
		};
		const hide = (e: Event) => {
			if ((e.target as HTMLElement).closest?.("a")) setLinkHover(null);
		};
		dom.addEventListener("mouseover", show);
		dom.addEventListener("mouseout", hide);
		return () => {
			dom.removeEventListener("mouseover", show);
			dom.removeEventListener("mouseout", hide);
		};
	}, [editor]);

	const handleFilePick = (e: ChangeEvent<HTMLInputElement>) => {
		const files = imagesFromList(e.target.files);
		if (files.length) void uploadAndInsertMany(files);
		e.target.value = "";
	};

	const handleAttachPick = (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files ? Array.from(e.target.files) : [];
		if (files.length) void attachAndInsertMany(files);
		e.target.value = "";
	};

	if (!editor) return null;

	// 링크 적용 — URL 정규화 후, 선택영역이 비고 링크가 아니면 URL 자체를 링크 텍스트로 삽입
	const applyLink = () => {
		const href = normalizeUrl(linkInputRef.current?.value ?? "");
		const chain = editor.chain().focus();
		if (!href) {
			chain.extendMarkRange("link").unsetLink().run();
		} else if (editor.state.selection.empty && !editor.isActive("link")) {
			chain
				.insertContent({
					type: "text",
					text: href,
					marks: [{ type: "link", attrs: { href, target: "_blank" } }],
				})
				.run();
		} else {
			chain.extendMarkRange("link").setLink({ href, target: "_blank" }).run();
		}
		setLinkOpen(false);
	};
	const removeLink = () => {
		editor.chain().focus().extendMarkRange("link").unsetLink().run();
		setLinkOpen(false);
	};

	const currentColor = editor.getAttributes("textStyle").color as string | undefined;
	const currentBg = editor.getAttributes("textStyle").backgroundColor as string | undefined;
	const currentSize = editor.getAttributes("textStyle").fontSize as string | undefined;
	const currentLineHeight = (editor.getAttributes("paragraph").lineHeight ??
		editor.getAttributes("heading").lineHeight) as string | undefined;

	const applyFontPx = (px: number) => {
		const n = Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, Math.round(px)));
		editor.chain().focus().setFontSize(`${n}px`).run();
	};
	// 입력칸 값을 적용 (Enter)
	const applySizeInput = () => {
		const n = Number(sizeInputRef.current?.value);
		if (Number.isFinite(n) && n > 0) applyFontPx(n);
	};
	// − / + 스테퍼
	const bumpFontPx = (delta: number) =>
		applyFontPx((currentSize ? Number.parseInt(currentSize, 10) : DEFAULT_FONT_PX) + delta);

	// 정렬 — 이미지가 선택돼 있으면 이미지 위치, 아니면 문단 정렬
	const imageActive = editor.isActive("image");
	const isAligned = (a: "left" | "center" | "right") =>
		imageActive
			? ((editor.getAttributes("image").align as string | undefined) ?? "center") === a
			: editor.isActive({ textAlign: a });
	const setAlign = (a: "left" | "center" | "right") =>
		imageActive
			? editor.chain().focus().updateAttributes("image", { align: a }).run()
			: editor.chain().focus().setTextAlign(a).run();

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-2">
			{editable && (
				<div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b bg-background py-1.5">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={!editor.can().undo()}
						onClick={() => editor.chain().focus().undo().run()}
						aria-label="실행 취소"
					>
						<Undo2 className="size-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={!editor.can().redo()}
						onClick={() => editor.chain().focus().redo().run()}
						aria-label="다시 실행"
					>
						<Redo2 className="size-4" />
					</Button>
					<Divider />
					{/* 글자 크기 — 구글 독스처럼 [−] [px] [+] 항상 노출 */}
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-8"
						onClick={() => bumpFontPx(-1)}
						aria-label="글자 작게"
					>
						<Minus className="size-4" />
					</Button>
					<input
						key={currentSize ?? "default"}
						ref={sizeInputRef}
						type="number"
						min={MIN_FONT_PX}
						max={MAX_FONT_PX}
						defaultValue={currentSize ? Number.parseInt(currentSize, 10) : DEFAULT_FONT_PX}
						aria-label="글자 크기(px)"
						title="글자 크기(px) — 입력 후 Enter"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								applySizeInput();
							}
						}}
						className="h-8 w-11 rounded-md border bg-background text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-8"
						onClick={() => bumpFontPx(1)}
						aria-label="글자 크게"
					>
						<Plus className="size-4" />
					</Button>
					<Divider />
					<Toggle
						size="sm"
						pressed={editor.isActive("bold")}
						onPressedChange={() => editor.chain().focus().toggleBold().run()}
						aria-label="굵게"
					>
						<Bold className="size-4" />
					</Toggle>
					<Toggle
						size="sm"
						pressed={editor.isActive("italic")}
						onPressedChange={() => editor.chain().focus().toggleItalic().run()}
						aria-label="기울임"
					>
						<Italic className="size-4" />
					</Toggle>
					<Toggle
						size="sm"
						pressed={editor.isActive("underline")}
						onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
						aria-label="밑줄"
					>
						<UnderlineIcon className="size-4" />
					</Toggle>
					<Toggle
						size="sm"
						pressed={editor.isActive("strike")}
						onPressedChange={() => editor.chain().focus().toggleStrike().run()}
						aria-label="취소선"
					>
						<Strikethrough className="size-4" />
					</Toggle>
					<Toggle
						size="sm"
						pressed={editor.isActive("code")}
						onPressedChange={() => editor.chain().focus().toggleCode().run()}
						aria-label="인라인 코드"
					>
						<Code className="size-4" />
					</Toggle>
					{/* 글자 색상 */}
					<Popover>
						<PopoverTrigger
							render={
								<Button type="button" variant="ghost" size="icon" aria-label="글자 색상">
									<Baseline
										className="size-4"
										style={currentColor ? { color: currentColor } : undefined}
									/>
								</Button>
							}
						/>
						<PopoverContent align="start" className="w-auto p-2">
							<div className="grid grid-cols-5 gap-1">
								<button
									type="button"
									title="기본"
									onClick={() => editor.chain().focus().unsetColor().run()}
									className="flex size-7 items-center justify-center rounded-md border hover:ring-2 hover:ring-ring"
								>
									<Ban className="size-4 text-muted-foreground" />
								</button>
								{TEXT_COLORS.map((c) => (
									<button
										key={c.value}
										type="button"
										title={c.label}
										onClick={() => editor.chain().focus().setColor(c.value).run()}
										className="flex size-7 items-center justify-center rounded-md border hover:ring-2 hover:ring-ring"
										style={{
											outline: currentColor === c.value ? "2px solid currentColor" : undefined,
										}}
									>
										<span className="size-4 rounded-full" style={{ backgroundColor: c.value }} />
									</button>
								))}
							</div>
						</PopoverContent>
					</Popover>
					{/* 형광펜 */}
					<Popover>
						<PopoverTrigger
							render={
								<Button type="button" variant="ghost" size="icon" aria-label="형광펜">
									<Highlighter
										className="size-4"
										style={currentBg ? { color: currentBg } : undefined}
									/>
								</Button>
							}
						/>
						<PopoverContent align="start" className="w-auto p-2">
							<div className="grid grid-cols-4 gap-1">
								<button
									type="button"
									title="없음"
									onClick={() => editor.chain().focus().unsetBackgroundColor().run()}
									className="flex size-7 items-center justify-center rounded-md border hover:ring-2 hover:ring-ring"
								>
									<Ban className="size-4 text-muted-foreground" />
								</button>
								{HIGHLIGHT_COLORS.map((c) => (
									<button
										key={c.value}
										type="button"
										title={c.label}
										onClick={() => editor.chain().focus().setBackgroundColor(c.value).run()}
										className="flex size-7 items-center justify-center rounded-md border hover:ring-2 hover:ring-ring"
										style={{
											outline: currentBg === c.value ? "2px solid currentColor" : undefined,
										}}
									>
										<span
											className="size-4 rounded-full border"
											style={{ backgroundColor: c.value }}
										/>
									</button>
								))}
							</div>
						</PopoverContent>
					</Popover>
					<Divider />
					<Popover open={linkOpen} onOpenChange={setLinkOpen}>
						<PopoverTrigger
							render={
								<Button
									type="button"
									variant={editor.isActive("link") ? "secondary" : "ghost"}
									size="icon"
									aria-label="링크"
								>
									<Link2 className="size-4" />
								</Button>
							}
						/>
						<PopoverContent align="start" className="w-72 space-y-1 p-2">
							<div className="flex items-center gap-1">
								<input
									key={
										linkOpen ? ((editor.getAttributes("link").href as string) ?? "new") : "closed"
									}
									ref={linkInputRef}
									type="url"
									defaultValue={(editor.getAttributes("link").href as string) ?? ""}
									placeholder="naver.com 또는 https://..."
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											applyLink();
										}
									}}
									className="h-8 flex-1 rounded-md border bg-background px-2 text-sm"
								/>
								<Button type="button" size="sm" className="h-8" onClick={applyLink}>
									적용
								</Button>
							</div>
							{editor.isActive("link") && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={removeLink}
									className="h-7 w-full justify-start text-destructive hover:text-destructive"
								>
									<Trash2 className="size-3.5" /> 링크 제거
								</Button>
							)}
						</PopoverContent>
					</Popover>
					{uploadImage && (
						<>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								multiple
								className="hidden"
								onChange={handleFilePick}
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={uploading}
								onClick={() => fileInputRef.current?.click()}
								aria-label="사진"
								title={uploading ? "업로드 중…" : "사진 추가"}
							>
								<ImageIcon className="size-4" />
							</Button>
						</>
					)}
					{uploadFile && (
						<>
							<input
								ref={attachInputRef}
								type="file"
								multiple
								className="hidden"
								onChange={handleAttachPick}
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={uploading}
								onClick={() => attachInputRef.current?.click()}
								aria-label="파일 첨부"
								title={uploading ? "업로드 중…" : "파일 첨부(여러 개 가능)"}
							>
								<Paperclip className="size-4" />
							</Button>
						</>
					)}
					<Divider />
					{/* 정렬 */}
					<Toggle
						size="sm"
						pressed={isAligned("left")}
						onPressedChange={() => setAlign("left")}
						aria-label={imageActive ? "이미지 왼쪽" : "왼쪽 정렬"}
					>
						<AlignLeft className="size-4" />
					</Toggle>
					<Toggle
						size="sm"
						pressed={isAligned("center")}
						onPressedChange={() => setAlign("center")}
						aria-label={imageActive ? "이미지 가운데" : "가운데 정렬"}
					>
						<AlignCenter className="size-4" />
					</Toggle>
					<Toggle
						size="sm"
						pressed={isAligned("right")}
						onPressedChange={() => setAlign("right")}
						aria-label={imageActive ? "이미지 오른쪽" : "오른쪽 정렬"}
					>
						<AlignRight className="size-4" />
					</Toggle>
					{/* 줄 간격 */}
					<Popover>
						<PopoverTrigger
							render={
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label="줄 간격"
									title="줄 간격"
								>
									<AlignVerticalSpaceAround className="size-4" />
								</Button>
							}
						/>
						<PopoverContent align="start" className="w-28 p-1">
							{LINE_HEIGHTS.map((lh) => (
								<button
									key={lh}
									type="button"
									onClick={() => editor.chain().focus().setLineHeight(lh).run()}
									className={`flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-muted ${currentLineHeight === lh ? "bg-muted font-medium" : ""}`}
								>
									{lh}
								</button>
							))}
							<button
								type="button"
								onClick={() => editor.chain().focus().unsetLineHeight().run()}
								className={`flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-muted ${currentLineHeight ? "" : "bg-muted font-medium"}`}
							>
								기본
							</button>
						</PopoverContent>
					</Popover>
					<Divider />
					{/* 목록 */}
					<Toggle
						size="sm"
						pressed={editor.isActive("bulletList")}
						onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
						aria-label="목록"
					>
						<List className="size-4" />
					</Toggle>
					<Toggle
						size="sm"
						pressed={editor.isActive("orderedList")}
						onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
						aria-label="번호 목록"
					>
						<ListOrdered className="size-4" />
					</Toggle>
					<Toggle
						size="sm"
						pressed={editor.isActive("taskList")}
						onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
						aria-label="체크리스트"
						title="체크리스트"
					>
						<ListChecks className="size-4" />
					</Toggle>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => editor.chain().focus().outdent().run()}
						aria-label="내어쓰기"
						title="내어쓰기"
					>
						<IndentDecrease className="size-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => editor.chain().focus().indent().run()}
						aria-label="들여쓰기"
						title="들여쓰기"
					>
						<IndentIncrease className="size-4" />
					</Button>
					<Toggle
						size="sm"
						pressed={editor.isActive("blockquote")}
						onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
						aria-label="인용"
					>
						<Quote className="size-4" />
					</Toggle>
					<Toggle
						size="sm"
						pressed={false}
						onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
						aria-label="구분선"
					>
						<Minus className="size-4" />
					</Toggle>
					<Divider />
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => editor.chain().focus().unsetAllMarks().run()}
						aria-label="서식 지우기"
					>
						<RemoveFormatting className="size-4" />
					</Button>
				</div>
			)}
			<div className="relative flex flex-1 flex-col">
				<EditorContent editor={editor} className="flex flex-1 flex-col [&>.ProseMirror]:flex-1" />
				{linkHover?.href && (
					<div
						data-link-card
						className="pointer-events-none fixed z-50 flex max-w-xs items-center gap-1 rounded-md border bg-popover px-2 py-1 text-popover-foreground text-xs shadow-md"
						style={{ top: linkHover.y + 6, left: linkHover.x }}
					>
						<ExternalLink className="size-3 shrink-0 text-muted-foreground" />
						<span className="truncate">{linkHover.href}</span>
					</div>
				)}
			</div>
		</div>
	);
};
