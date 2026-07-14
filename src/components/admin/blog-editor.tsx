import type { ChainedCommands } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	ArrowLeft,
	Ban,
	Bold,
	Heading2,
	Heading3,
	ImagePlus,
	Italic,
	Link2,
	List,
	ListOrdered,
	Minus,
	Plus,
	Quote,
	Trash2,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button, Input, Label, Textarea } from "@/components/ui/ds";
import { createPost, htmlToText, slugify, updatePost, uploadBlogImage } from "@/lib/blog";
import { cn } from "@/lib/utils";
import type { BlogAuthor, BlogCategory, BlogPost } from "@/types/database";

// TextStyle의 fontSize 속성을 추가하는 확장 — 별도 패키지가 tiptap v3와 버전이 맞지 않아 직접 정의.
declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		fontSize: {
			setFontSize: (fontSize: string) => ReturnType;
			unsetFontSize: () => ReturnType;
		};
	}
}

const FontSize = Extension.create({
	name: "fontSize",
	addOptions() {
		return { types: ["textStyle"] };
	},
	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					fontSize: {
						default: null,
						parseHTML: (element: HTMLElement) => element.style.fontSize || null,
						renderHTML: (attributes: { fontSize?: string | null }) => {
							if (!attributes.fontSize) return {};
							return { style: `font-size: ${attributes.fontSize}` };
						},
					},
				},
			},
		];
	},
	addCommands() {
		return {
			setFontSize:
				(fontSize: string) =>
				({ chain }: { chain: () => ChainedCommands }) =>
					chain().setMark("textStyle", { fontSize }).run(),
			unsetFontSize:
				() =>
				({ chain }: { chain: () => ChainedCommands }) =>
					chain().setMark("textStyle", { fontSize: null }).run(),
		};
	},
});

const TEXT_COLORS = [
	{ label: "빨강", value: "#c0392b" },
	{ label: "파랑", value: "#2563eb" },
	{ label: "초록", value: "#16a34a" },
	{ label: "회색", value: "#6b7280" },
	{ label: "브랜드", value: "#6c5d4c" },
];

const FONT_SIZES = [
	{ label: "작게", value: "14px" },
	{ label: "보통", value: "16px" },
	{ label: "크게", value: "20px" },
	{ label: "아주 크게", value: "26px" },
];

const SKELETON = `<p>이 글의 결론을 2~3문장으로 적어주세요. (검색·AI가 이 부분을 답으로 인용합니다)</p><h2>질문형 소제목을 적어주세요 (예: F-6 심사에서 무엇을 보나요?)</h2><p>본문을 작성하세요…</p>`;

// 로컬 편집용(안정적 key 보장) — 저장 시 _id 제거
type FaqRow = { _id: string; q: string; a: string };
type SourceRow = { _id: string; label: string; href: string };

type Props = {
	post: BlogPost | null; // null이면 새 글
	categories: BlogCategory[];
	authors: BlogAuthor[];
	onClose: () => void;
	onSaved: () => void;
};

const ToolbarButton = ({
	active,
	onClick,
	title,
	children,
}: {
	active?: boolean;
	onClick: () => void;
	title: string;
	children: ReactNode;
}) => (
	<button
		type="button"
		title={title}
		onClick={onClick}
		className={cn(
			"flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted",
			active && "bg-accent text-accent-foreground",
		)}
	>
		{children}
	</button>
);

export const BlogEditor = ({ post, categories, authors, onClose, onSaved }: Props) => {
	const [title, setTitle] = useState(post?.title ?? "");
	const [slug, setSlug] = useState(post?.slug ?? "");
	const [slugTouched, setSlugTouched] = useState(Boolean(post));
	const [categoryId, setCategoryId] = useState(post?.category_id ?? "");
	const [authorId, setAuthorId] = useState(post?.author_id ?? authors[0]?.id ?? "");
	const [coverUrl, setCoverUrl] = useState(post?.cover_url ?? "");
	const [coverAlt, setCoverAlt] = useState(post?.cover_alt ?? "");
	const [tldr, setTldr] = useState(post?.tldr ?? "");
	const [faq, setFaq] = useState<FaqRow[]>(() =>
		(post?.faq ?? []).map((f) => ({ _id: crypto.randomUUID(), q: f.q, a: f.a })),
	);
	const [sources, setSources] = useState<SourceRow[]>(() =>
		(post?.sources ?? []).map((s) => ({ _id: crypto.randomUUID(), label: s.label, href: s.href })),
	);
	const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
	const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? "");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [coverUploading, setCoverUploading] = useState(false);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
			Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
			Image.configure({ HTMLAttributes: { class: "blog-img" } }),
			Placeholder.configure({ placeholder: "본문을 작성하세요…" }),
			TextStyle,
			Color,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			FontSize,
		],
		content: post?.content ?? SKELETON,
	});

	const handleTitleChange = (value: string) => {
		setTitle(value);
		if (!slugTouched) setSlug(slugify(value));
	};

	const handleInsertImage = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file || !editor) return;
			const url = await uploadBlogImage(file);
			if (!url) {
				setError("이미지 업로드에 실패했습니다.");
				return;
			}
			const alt = window.prompt("이미지 설명(alt)을 입력하세요. (접근성·이미지 SEO)") ?? "";
			editor.chain().focus().setImage({ src: url, alt }).run();
		};
		input.click();
	};

	const handleSetLink = () => {
		if (!editor) return;
		const prev = editor.getAttributes("link").href ?? "";
		const url = window.prompt("링크 URL", prev);
		if (url === null) return;
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	};

	const handleCoverUpload = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			setCoverUploading(true);
			const url = await uploadBlogImage(file);
			setCoverUploading(false);
			if (!url) {
				setError("커버 이미지 업로드에 실패했습니다.");
				return;
			}
			setCoverUrl(url);
		};
		input.click();
	};

	const save = async (status: "draft" | "published") => {
		if (!editor) return;
		if (!title.trim()) {
			setError("제목을 입력해 주세요.");
			return;
		}
		if (!categoryId) {
			setError("카테고리를 선택해 주세요.");
			return;
		}
		setError(null);
		setSaving(true);

		const contentHtml = editor.getHTML();
		const plain = htmlToText(contentHtml);
		const finalSlug = slug.trim() || slugify(title);
		const payload = {
			slug: finalSlug,
			title: title.trim(),
			excerpt: (tldr.trim() || plain).slice(0, 155),
			content: contentHtml,
			cover_url: coverUrl.trim() || null,
			cover_alt: coverAlt.trim() || null,
			tldr: tldr.trim() || null,
			faq: faq.filter((f) => f.q.trim() && f.a.trim()).map((f) => ({ q: f.q, a: f.a })),
			sources: sources
				.filter((s) => s.label.trim() && s.href.trim())
				.map((s) => ({ label: s.label, href: s.href })),
			category_id: categoryId || null,
			author_id: authorId || null,
			status,
			meta_title: metaTitle.trim() || null,
			meta_description: metaDescription.trim() || plain.slice(0, 155) || null,
			published_at:
				status === "published" ? (post?.published_at ?? new Date().toISOString()) : null,
		};

		const ok = post ? await updatePost(post.id, payload) : Boolean(await createPost(payload));
		setSaving(false);
		if (!ok) {
			setError("저장에 실패했습니다. 다시 시도해 주세요.");
			return;
		}
		onSaved();
		onClose();
	};

	if (!editor) return null;

	return (
		<div className="max-w-[1280px]">
			<div className="mb-5 flex items-center justify-between gap-4">
				<button
					type="button"
					onClick={onClose}
					className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm hover:text-foreground"
				>
					<ArrowLeft size={17} /> 목록으로
				</button>
				<div className="flex items-center gap-2.5">
					<Button variant="outline" onClick={() => save("draft")} disabled={saving}>
						임시저장
					</Button>
					<Button variant="primary" onClick={() => save("published")} disabled={saving}>
						{saving ? "저장 중…" : "발행"}
					</Button>
				</div>
			</div>

			{error && (
				<div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
					{error}
				</div>
			)}

			<div className="grid grid-cols-[1fr_340px] items-start gap-5">
				{/* 본문 에디터 */}
				<div className="overflow-hidden rounded-md border border-border bg-card">
					<input
						value={title}
						onChange={(e) => handleTitleChange(e.target.value)}
						placeholder="제목을 입력하세요"
						className="w-full border-border border-b px-6 py-5 font-bold text-2xl text-foreground tracking-[-0.02em] outline-none placeholder:text-muted-foreground"
					/>
					<div className="flex flex-wrap items-center gap-1 border-border border-b bg-muted px-3 py-2">
						<ToolbarButton
							title="제목2"
							active={editor.isActive("heading", { level: 2 })}
							onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
						>
							<Heading2 size={18} />
						</ToolbarButton>
						<ToolbarButton
							title="제목3"
							active={editor.isActive("heading", { level: 3 })}
							onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
						>
							<Heading3 size={18} />
						</ToolbarButton>
						<div className="mx-1 h-5 w-px bg-border" />
						<select
							title="글자 크기"
							value={editor.getAttributes("textStyle").fontSize ?? ""}
							onChange={(e) => {
								const value = e.target.value;
								if (value) editor.chain().focus().setFontSize(value).run();
								else editor.chain().focus().unsetFontSize().run();
							}}
							className="h-9 rounded-md border border-transparent bg-transparent px-1.5 text-foreground text-sm outline-none hover:bg-muted"
						>
							<option value="">글자 크기</option>
							{FONT_SIZES.map((f) => (
								<option key={f.value} value={f.value}>
									{f.label}
								</option>
							))}
						</select>
						<div className="mx-1 h-5 w-px bg-border" />
						<div className="flex items-center gap-1 px-0.5">
							{TEXT_COLORS.map((c) => (
								<button
									key={c.value}
									type="button"
									title={c.label}
									onClick={() => editor.chain().focus().setColor(c.value).run()}
									style={{ backgroundColor: c.value }}
									className={cn(
										"h-5 w-5 flex-shrink-0 rounded-full ring-1 ring-border ring-inset transition-transform hover:scale-110",
										editor.isActive("textStyle", { color: c.value }) &&
											"ring-2 ring-foreground ring-offset-1",
									)}
								/>
							))}
							<ToolbarButton
								title="글자색 초기화"
								onClick={() => editor.chain().focus().unsetColor().run()}
							>
								<Ban size={16} />
							</ToolbarButton>
						</div>
						<div className="mx-1 h-5 w-px bg-border" />
						<ToolbarButton
							title="굵게"
							active={editor.isActive("bold")}
							onClick={() => editor.chain().focus().toggleBold().run()}
						>
							<Bold size={17} />
						</ToolbarButton>
						<ToolbarButton
							title="기울임"
							active={editor.isActive("italic")}
							onClick={() => editor.chain().focus().toggleItalic().run()}
						>
							<Italic size={17} />
						</ToolbarButton>
						<ToolbarButton title="링크" active={editor.isActive("link")} onClick={handleSetLink}>
							<Link2 size={17} />
						</ToolbarButton>
						<div className="mx-1 h-5 w-px bg-border" />
						<ToolbarButton
							title="왼쪽 정렬"
							active={editor.isActive({ textAlign: "left" })}
							onClick={() => editor.chain().focus().setTextAlign("left").run()}
						>
							<AlignLeft size={17} />
						</ToolbarButton>
						<ToolbarButton
							title="가운데 정렬"
							active={editor.isActive({ textAlign: "center" })}
							onClick={() => editor.chain().focus().setTextAlign("center").run()}
						>
							<AlignCenter size={17} />
						</ToolbarButton>
						<ToolbarButton
							title="오른쪽 정렬"
							active={editor.isActive({ textAlign: "right" })}
							onClick={() => editor.chain().focus().setTextAlign("right").run()}
						>
							<AlignRight size={17} />
						</ToolbarButton>
						<div className="mx-1 h-5 w-px bg-border" />
						<ToolbarButton
							title="글머리 목록"
							active={editor.isActive("bulletList")}
							onClick={() => editor.chain().focus().toggleBulletList().run()}
						>
							<List size={17} />
						</ToolbarButton>
						<ToolbarButton
							title="번호 목록"
							active={editor.isActive("orderedList")}
							onClick={() => editor.chain().focus().toggleOrderedList().run()}
						>
							<ListOrdered size={17} />
						</ToolbarButton>
						<ToolbarButton
							title="인용"
							active={editor.isActive("blockquote")}
							onClick={() => editor.chain().focus().toggleBlockquote().run()}
						>
							<Quote size={17} />
						</ToolbarButton>
						<ToolbarButton
							title="구분선"
							onClick={() => editor.chain().focus().setHorizontalRule().run()}
						>
							<Minus size={17} />
						</ToolbarButton>
						<ToolbarButton title="이미지" onClick={handleInsertImage}>
							<ImagePlus size={17} />
						</ToolbarButton>
					</div>
					<EditorContent editor={editor} className="blog-prose px-6 py-5" />
				</div>

				{/* 발행 설정 사이드 */}
				<div className="flex flex-col gap-4">
					<div className="rounded-md border border-border bg-card p-5">
						<div className="mb-3 font-bold text-foreground text-sm">기본</div>
						<div className="mb-4">
							<Label htmlFor="be-cat">카테고리</Label>
							<select
								id="be-cat"
								value={categoryId}
								onChange={(e) => setCategoryId(e.target.value)}
								className="h-12 w-full rounded-md border border-border bg-card px-3.5 text-[var(--text-body)] text-base"
							>
								<option value="">선택하세요</option>
								{categories.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</div>
						<div className="mb-4">
							<Label htmlFor="be-slug">slug (URL)</Label>
							<Input
								id="be-slug"
								value={slug}
								onChange={(e) => {
									setSlug(e.target.value);
									setSlugTouched(true);
								}}
								placeholder="자동 생성됩니다"
							/>
						</div>
						<div>
							<Label htmlFor="be-cover">커버 이미지</Label>
							{coverUrl && (
								<img
									src={coverUrl}
									alt={coverAlt || "커버 미리보기"}
									className="mb-2 aspect-video w-full rounded-md border border-border object-cover"
								/>
							)}
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleCoverUpload}
									disabled={coverUploading}
								>
									{coverUploading ? "업로드 중…" : coverUrl ? "변경" : "업로드"}
								</Button>
								{coverUrl && (
									<Button variant="ghost" size="sm" onClick={() => setCoverUrl("")}>
										제거
									</Button>
								)}
							</div>
							<Input
								className="mt-2"
								value={coverAlt}
								onChange={(e) => setCoverAlt(e.target.value)}
								placeholder="커버 이미지 설명(alt)"
							/>
						</div>
					</div>

					<details className="rounded-md border border-border bg-card p-5">
						<summary className="cursor-pointer font-bold text-foreground text-sm">SEO</summary>
						<div className="mt-4">
							<Label htmlFor="be-mt">검색 제목</Label>
							<Input
								id="be-mt"
								value={metaTitle}
								onChange={(e) => setMetaTitle(e.target.value)}
								placeholder="비우면 제목 사용"
							/>
						</div>
						<div className="mt-4">
							<Label htmlFor="be-md">검색 설명</Label>
							<Textarea
								id="be-md"
								rows={3}
								value={metaDescription}
								onChange={(e) => setMetaDescription(e.target.value)}
								placeholder="비우면 본문 앞 155자 자동"
							/>
						</div>
					</details>

					<details className="rounded-md border border-border bg-card p-5">
						<summary className="cursor-pointer font-bold text-foreground text-sm">
							AEO · 요점 / FAQ / 출처
						</summary>
						<div className="mt-4">
							<Label htmlFor="be-tldr">요점 (TL;DR)</Label>
							<Textarea
								id="be-tldr"
								rows={3}
								value={tldr}
								onChange={(e) => setTldr(e.target.value)}
								placeholder="이 글의 결론을 2~3문장으로"
							/>
						</div>

						<div className="mt-5">
							<div className="mb-2 flex items-center justify-between">
								<span className="font-medium text-foreground text-sm">FAQ</span>
								<button
									type="button"
									onClick={() => setFaq((p) => [...p, { _id: crypto.randomUUID(), q: "", a: "" }])}
									className="flex items-center gap-1 font-medium text-[13px] text-primary hover:underline"
								>
									<Plus size={14} /> 추가
								</button>
							</div>
							<div className="flex flex-col gap-3">
								{faq.map((f, i) => (
									<div key={f._id} className="rounded-md border border-border p-3">
										<div className="mb-2 flex items-center justify-between">
											<span className="text-[13px] text-muted-foreground">질문 {i + 1}</span>
											<button
												type="button"
												aria-label="FAQ 삭제"
												onClick={() => setFaq((p) => p.filter((x) => x._id !== f._id))}
												className="text-muted-foreground hover:text-destructive"
											>
												<Trash2 size={14} />
											</button>
										</div>
										<Input
											className="mb-2 h-10"
											value={f.q}
											onChange={(e) =>
												setFaq((p) =>
													p.map((x) => (x._id === f._id ? { ...x, q: e.target.value } : x)),
												)
											}
											placeholder="질문"
										/>
										<Textarea
											rows={2}
											value={f.a}
											onChange={(e) =>
												setFaq((p) =>
													p.map((x) => (x._id === f._id ? { ...x, a: e.target.value } : x)),
												)
											}
											placeholder="답변"
										/>
									</div>
								))}
							</div>
						</div>

						<div className="mt-5">
							<div className="mb-2 flex items-center justify-between">
								<span className="font-medium text-foreground text-sm">참고 출처</span>
								<button
									type="button"
									onClick={() =>
										setSources((p) => [...p, { _id: crypto.randomUUID(), label: "", href: "" }])
									}
									className="flex items-center gap-1 font-medium text-[13px] text-primary hover:underline"
								>
									<Plus size={14} /> 추가
								</button>
							</div>
							<div className="flex flex-col gap-3">
								{sources.map((s, i) => (
									<div key={s._id} className="rounded-md border border-border p-3">
										<div className="mb-2 flex items-center justify-between">
											<span className="text-[13px] text-muted-foreground">출처 {i + 1}</span>
											<button
												type="button"
												aria-label="출처 삭제"
												onClick={() => setSources((p) => p.filter((x) => x._id !== s._id))}
												className="text-muted-foreground hover:text-destructive"
											>
												<Trash2 size={14} />
											</button>
										</div>
										<Input
											className="mb-2 h-10"
											value={s.label}
											onChange={(e) =>
												setSources((p) =>
													p.map((x) => (x._id === s._id ? { ...x, label: e.target.value } : x)),
												)
											}
											placeholder="라벨 (예: 하이코리아)"
										/>
										<Input
											className="h-10"
											value={s.href}
											onChange={(e) =>
												setSources((p) =>
													p.map((x) => (x._id === s._id ? { ...x, href: e.target.value } : x)),
												)
											}
											placeholder="https://"
										/>
									</div>
								))}
							</div>
						</div>
					</details>

					<details className="rounded-md border border-border bg-card p-5">
						<summary className="cursor-pointer font-bold text-foreground text-sm">작성자</summary>
						<div className="mt-4">
							<Label htmlFor="be-author">작성자</Label>
							<select
								id="be-author"
								value={authorId}
								onChange={(e) => setAuthorId(e.target.value)}
								className="h-12 w-full rounded-md border border-border bg-card px-3.5 text-[var(--text-body)] text-base"
							>
								{authors.map((a) => (
									<option key={a.id} value={a.id}>
										{a.name}
									</option>
								))}
							</select>
						</div>
					</details>
				</div>
			</div>
		</div>
	);
};
