import { ArrowLeft, Columns2, Eye, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import {
	RichTextEditor,
	type RichTextEditorHandle,
} from "@/components/common/editor/RichTextEditor";
import { Button, Input, Label, Textarea } from "@/components/ui/ds";
import {
	createPost,
	htmlToText,
	slugify,
	updatePost,
	uploadBlogFile,
	uploadBlogImage,
} from "@/lib/blog";
import { cn } from "@/lib/utils";
import type { BlogAuthor, BlogCategory, BlogPost } from "@/types/database";

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
	// 분할 미리보기 — 기본 노출(velog식)
	const [showPreview, setShowPreview] = useState(true);
	// 분할 미리보기용 라이브 HTML — 편집할 때마다 갱신
	const [previewHtml, setPreviewHtml] = useState(post?.content ?? SKELETON);
	const editorRef = useRef<RichTextEditorHandle>(null);

	const handleTitleChange = (value: string) => {
		setTitle(value);
		if (!slugTouched) setSlug(slugify(value));
	};

	// RichTextEditor 는 실패 시 throw 를 기대(토스트로 안내) — 기존 nullable 업로더를 어댑트
	const handleUploadImage = async (file: File): Promise<string> => {
		const url = await uploadBlogImage(file);
		if (!url) throw new Error("이미지 업로드에 실패했습니다.");
		return url;
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

		const contentHtml = editorRef.current?.getHTML() ?? previewHtml;
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

	return (
		<div className="max-w-[1600px]">
			<div className="mb-5 flex items-center justify-between gap-4">
				<button
					type="button"
					onClick={onClose}
					className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm hover:text-foreground"
				>
					<ArrowLeft size={17} /> 목록으로
				</button>
				<div className="flex items-center gap-2.5">
					<Button
						variant={showPreview ? "primary" : "outline"}
						iconStart={<Columns2 size={16} />}
						onClick={() => setShowPreview((v) => !v)}
					>
						미리보기
					</Button>
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

			{/* 본문 에디터 / 미리보기 — 기본 50:50 분할, 각 패널 고정 높이 + 내부 스크롤 */}
			<div
				className={cn(
					"grid items-start gap-5",
					showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
				)}
			>
				<div className="flex h-[calc(100vh-260px)] min-h-[460px] flex-col overflow-hidden rounded-md border border-border bg-card">
					<input
						value={title}
						onChange={(e) => handleTitleChange(e.target.value)}
						placeholder="제목을 입력하세요"
						className="w-full shrink-0 border-border border-b px-6 py-5 font-bold text-2xl text-foreground tracking-[-0.02em] outline-none placeholder:text-muted-foreground"
					/>
					<div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">
						<RichTextEditor
							ref={editorRef}
							content={post?.content ?? SKELETON}
							editable
							placeholder="본문을 작성하세요…"
							uploadImage={handleUploadImage}
							uploadFile={uploadBlogFile}
							onChange={setPreviewHtml}
						/>
					</div>
				</div>

				{/* 분할 미리보기 — 홈페이지 노출 모습(velog식) */}
				{showPreview && (
					<div className="flex h-[calc(100vh-260px)] min-h-[460px] flex-col overflow-hidden rounded-md border border-border bg-card">
						<div className="flex shrink-0 items-center gap-2 border-border border-b bg-muted px-4 py-2.5 font-semibold text-[13px] text-muted-foreground">
							<Eye size={15} /> 미리보기 · 홈페이지 노출 모습
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto px-7 py-7">
							{coverUrl && (
								<img
									src={coverUrl}
									alt={coverAlt || "커버"}
									className="mb-6 aspect-video w-full rounded-md border border-border object-cover"
								/>
							)}
							<h1 className="mb-5 font-bold text-[28px] text-foreground leading-tight tracking-[-0.02em]">
								{title || "제목을 입력하세요"}
							</h1>
							{/* biome-ignore lint/security/noDangerouslySetInnerHtml: 관리자 본인이 작성한 본문 미리보기 */}
							<div className="blog-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
						</div>
					</div>
				)}
			</div>

			{/* 발행 설정 — 에디터/미리보기 아래, 전체 폭 카드 그리드 */}
			<div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
	);
};
