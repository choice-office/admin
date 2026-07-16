import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";
import {
	RichTextEditor,
	type RichTextEditorHandle,
} from "@/components/common/editor/RichTextEditor";
import { Button, Input, Label, Select, Textarea } from "@/components/ui/ds";
import {
	createPost,
	htmlToText,
	slugify,
	updatePost,
	uploadBlogFile,
	uploadBlogImage,
} from "@/lib/blog";
import type { BlogAuthor, BlogCategory, BlogPost } from "@/types/database";

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
	// 작성자는 "초이스 행정사 사무소" 고정(없으면 null → 홈페이지가 동일 이름으로 폴백)
	const fixedAuthorId = authors.find((a) => a.name.includes("초이스"))?.id ?? null;
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
	const [tags, setTags] = useState<string[]>(post?.tags ?? []);
	const [tagInput, setTagInput] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [coverUploading, setCoverUploading] = useState(false);
	// 작성/미리보기 모드 — 미리보기는 홈페이지 노출 모습을 그대로 렌더
	const [mode, setMode] = useState<"write" | "preview">("write");
	const [previewHtml, setPreviewHtml] = useState(post?.content ?? "");
	const editorRef = useRef<RichTextEditorHandle>(null);

	const handleTitleChange = (value: string) => {
		setTitle(value);
		if (!slugTouched) setSlug(slugify(value));
	};

	const showPreview = () => {
		setPreviewHtml(editorRef.current?.getHTML() ?? previewHtml);
		setMode("preview");
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

	// 해시태그 — # 없이 저장(공백 제거·중복 제거). Enter/쉼표/스페이스로 확정.
	const addTag = (raw: string) => {
		const t = raw.trim().replace(/^#+/, "").replace(/\s+/g, "");
		if (!t) return;
		setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
		setTagInput("");
	};
	const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === "," || e.key === " ") {
			e.preventDefault();
			addTag(tagInput);
		} else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
			setTags((prev) => prev.slice(0, -1));
		}
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
			author_id: fixedAuthorId,
			status,
			meta_title: metaTitle.trim() || null,
			meta_description: metaDescription.trim() || plain.slice(0, 155) || null,
			tags,
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

	const tabClass = (active: boolean) =>
		`rounded px-4 py-1.5 font-medium text-sm transition-colors ${
			active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
		}`;

	return (
		<div className="flex h-full flex-col">
			{/* 상단 바 — 목록으로 + 작성/미리보기 모드 토글 */}
			<div className="mb-4 flex shrink-0 items-center justify-between gap-4">
				<button
					type="button"
					onClick={onClose}
					className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm hover:text-foreground"
				>
					<ArrowLeft size={17} /> 목록으로
				</button>
				<div className="flex items-center gap-2.5">
					<div className="inline-flex rounded-md border border-border bg-card p-0.5">
						<button
							type="button"
							onClick={() => setMode("write")}
							className={tabClass(mode === "write")}
						>
							작성
						</button>
						<button type="button" onClick={showPreview} className={tabClass(mode === "preview")}>
							미리보기
						</button>
					</div>
					<Button variant="outline" onClick={() => save("draft")} disabled={saving}>
						임시저장
					</Button>
					<Button variant="primary" onClick={() => save("published")} disabled={saving}>
						{saving ? "저장 중…" : "발행"}
					</Button>
				</div>
			</div>
			{error && (
				<div className="mb-4 shrink-0 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-destructive text-sm">
					{error}
				</div>
			)}

			{/* 좌: 작성/미리보기(길게) · 우: 발행 설정 */}
			<div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1fr_360px]">
				<div className="flex min-h-0 flex-col">
					{/* 작성 모드 — 제목 + 리치 에디터(항상 마운트 유지: 저장 시 HTML 읽기) */}
					<div
						className={
							mode === "write"
								? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card"
								: "hidden"
						}
					>
						<input
							value={title}
							onChange={(e) => handleTitleChange(e.target.value)}
							placeholder="제목을 입력하세요"
							className="w-full border-border border-b px-6 py-5 font-bold text-2xl text-foreground tracking-[-0.02em] outline-none placeholder:text-muted-foreground"
						/>
						<div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">
							<RichTextEditor
								ref={editorRef}
								content={post?.content ?? ""}
								editable
								placeholder="본문을 작성하세요. 질문형 소제목(제목2)으로 나누면 검색·AI에 유리합니다."
								uploadImage={handleUploadImage}
								uploadFile={uploadBlogFile}
								onChange={setPreviewHtml}
							/>
						</div>
					</div>

					{/* 미리보기 모드 — 홈페이지 노출 모습 */}
					{mode === "preview" && (
						<div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-card px-8 py-8">
							<h1 className="mb-5 font-bold text-[30px] text-foreground leading-tight tracking-[-0.02em]">
								{title || "제목을 입력하세요"}
							</h1>
							{tldr.trim() && (
								<div className="mb-6 rounded-md border border-border border-l-4 border-l-primary bg-muted px-4 py-3 text-[var(--text-body)] leading-relaxed">
									{tldr}
								</div>
							)}
							<div
								className="blog-preview"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: 관리자 본인이 작성한 본문 미리보기
								dangerouslySetInnerHTML={{
									__html: previewHtml || '<p style="color:#9ca3af">본문이 비어 있습니다.</p>',
								}}
							/>
						</div>
					)}
				</div>

				{/* 우: 발행 설정(세로 스택) */}
				<div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
					<div className="rounded-md border border-border bg-card p-5">
						<div className="mb-3 font-bold text-foreground text-sm">기본</div>
						<div className="mb-4">
							<Label htmlFor="be-cat">카테고리</Label>
							<Select
								id="be-cat"
								value={categoryId}
								onChange={(e) => setCategoryId(e.target.value)}
							>
								<option value="">선택하세요</option>
								{categories.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</Select>
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
								<>
									<img
										src={coverUrl}
										alt={coverAlt || "커버 미리보기"}
										className="aspect-[4/3] w-full rounded-md border border-border object-cover"
									/>
									<p className="mt-1 mb-2 text-[12px] text-muted-foreground">
										목록 카드 비율(4:3) 미리보기
									</p>
								</>
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

						<div className="mt-4">
							<Label htmlFor="be-tags">해시태그</Label>
							<div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5">
								{tags.map((t) => (
									<span
										key={t}
										className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[13px] text-muted-foreground"
									>
										#{t}
										<button
											type="button"
											aria-label={`태그 ${t} 삭제`}
											onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
											className="hover:text-destructive"
										>
											<X size={12} />
										</button>
									</span>
								))}
								<input
									id="be-tags"
									value={tagInput}
									onChange={(e) => setTagInput(e.target.value)}
									onKeyDown={handleTagKeyDown}
									onBlur={() => addTag(tagInput)}
									placeholder={tags.length ? "" : "예: F4비자연장"}
									className="min-w-[100px] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
								/>
							</div>
							<p className="mt-1 text-[12px] text-muted-foreground">
								# 없이 입력, Enter·쉼표·스페이스로 구분
							</p>
						</div>
					</div>

					{/* 요점(결론) — 본문과 별개 입력. 글 상단에 '요점'으로 노출됨 */}
					<div className="rounded-md border border-border bg-card p-5">
						<Label htmlFor="be-tldr">요점 (결론)</Label>
						<Textarea
							id="be-tldr"
							rows={4}
							value={tldr}
							onChange={(e) => setTldr(e.target.value)}
							placeholder="이 글의 결론을 2~3문장으로. (본문 아님)"
						/>
						<p className="mt-1.5 text-[12px] text-muted-foreground">
							글 <b>맨 위 요점 상자</b>로 노출되고, 검색·AI가 이 부분을 답으로 인용합니다. 본문에 또
							쓸 필요 없습니다.
						</p>
					</div>

					<details className="rounded-md border border-border bg-card p-5">
						<summary className="cursor-pointer font-bold text-foreground text-sm">
							FAQ · 참고 출처
						</summary>
						<div className="mt-4">
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
						<summary className="cursor-pointer font-bold text-foreground text-sm">
							SEO (검색 노출)
						</summary>
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
								placeholder="비우면 요점/본문 앞 155자 자동"
							/>
						</div>
					</details>

					<div className="rounded-md border border-border bg-card p-5">
						<div className="mb-1.5 font-bold text-foreground text-sm">작성자</div>
						<div className="text-[var(--text-body)] text-base">초이스 행정사 사무소</div>
						<p className="mt-1 text-[13px] text-muted-foreground">모든 글의 작성자로 고정됩니다.</p>
					</div>
				</div>
			</div>
		</div>
	);
};
