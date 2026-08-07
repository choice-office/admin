import { ArrowLeft, FileClock, Plus, Trash2, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { DraftListModal } from "@/components/admin/draft-list-modal";
import {
	RichTextEditor,
	type RichTextEditorHandle,
} from "@/components/common/editor/RichTextEditor";
import { Button, Input, Label, Textarea } from "@/components/ui/ds";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	createPost,
	DRAFT_RETENTION_DAYS,
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
	onOpenPost: (postId: string) => void; // 임시저장 목록에서 다른 글 이어서 작성
};

// 본문이 사실상 비었는지(빈 문단만 있는지) — 이탈 경고 판정에서 "안 쓴 것"으로 취급
const isBodyEmpty = (html: string): boolean =>
	!html
		.replace(/<[^>]*>/g, "")
		.replace(/&nbsp;/g, " ")
		.trim() && !/<(img|figure|table|iframe|hr)\b/i.test(html);

type EditableFields = {
	title: string;
	slug: string;
	categoryId: string;
	coverUrl: string;
	coverAlt: string;
	tldr: string;
	metaTitle: string;
	metaDescription: string;
	tags: string[];
	faq: { q: string; a: string }[];
	sources: { label: string; href: string }[];
	content: string;
};

// 저장 대상 값들의 스냅샷 — 초기값과 비교해 "작성 중" 여부를 판정한다.
const snapshotOf = (f: EditableFields): string =>
	JSON.stringify({
		...f,
		title: f.title.trim(),
		slug: f.slug.trim(),
		coverUrl: f.coverUrl.trim(),
		coverAlt: f.coverAlt.trim(),
		tldr: f.tldr.trim(),
		metaTitle: f.metaTitle.trim(),
		metaDescription: f.metaDescription.trim(),
		content: isBodyEmpty(f.content) ? "" : f.content.replace(/\s+/g, " ").trim(),
	});

export const BlogEditor = ({ post, categories, authors, onClose, onOpenPost }: Props) => {
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
	const [isDraftListOpen, setIsDraftListOpen] = useState(false);
	const [previewHtml, setPreviewHtml] = useState(post?.content ?? "");
	const editorRef = useRef<RichTextEditorHandle>(null);

	// 이탈 경고 — 새로고침/탭 닫기(beforeunload)와 "목록으로"에서 저장 안 된 작업을 한 번 막는다.
	const initialSnapshot = useRef(
		snapshotOf({
			title: post?.title ?? "",
			slug: post?.slug ?? "",
			categoryId: post?.category_id ?? "",
			coverUrl: post?.cover_url ?? "",
			coverAlt: post?.cover_alt ?? "",
			tldr: post?.tldr ?? "",
			metaTitle: post?.meta_title ?? "",
			metaDescription: post?.meta_description ?? "",
			tags: post?.tags ?? [],
			faq: (post?.faq ?? []).map((f) => ({ q: f.q, a: f.a })),
			sources: (post?.sources ?? []).map((s) => ({ label: s.label, href: s.href })),
			content: post?.content ?? "",
		}),
	);
	const isDirty =
		snapshotOf({
			title,
			slug,
			categoryId,
			coverUrl,
			coverAlt,
			tldr,
			metaTitle,
			metaDescription,
			tags,
			faq: faq.map((f) => ({ q: f.q, a: f.a })),
			sources: sources.map((s) => ({ label: s.label, href: s.href })),
			content: previewHtml,
		}) !== initialSnapshot.current;

	useEffect(() => {
		if (!isDirty) return;
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = ""; // 일부 브라우저는 returnValue 가 있어야 확인창을 띄운다
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty]);

	const handleClose = () => {
		if (isDirty && !confirm("작성 중인 내용이 있습니다. 저장하지 않고 목록으로 나갈까요?")) return;
		onClose();
	};

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
			try {
				const url = await uploadBlogImage(file);
				if (!url) {
					setError("커버 이미지 업로드에 실패했습니다.");
					return;
				}
				setCoverUrl(url);
			} catch (e) {
				// 형식·용량 차단 사유를 그대로 안내
				setError(
					e instanceof Error && e.message ? e.message : "커버 이미지 업로드에 실패했습니다.",
				);
			} finally {
				setCoverUploading(false);
			}
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
		onClose();
	};

	const tabClass = (active: boolean) =>
		`rounded px-4 py-1.5 font-medium text-sm transition-colors ${
			active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
		}`;

	return (
		<div className="flex h-full flex-col overflow-y-auto lg:overflow-hidden">
			{/* 상단 바 — 목록으로 + 작성/미리보기 모드 토글 */}
			<div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
				<button
					type="button"
					onClick={handleClose}
					className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm hover:text-foreground"
				>
					<ArrowLeft size={17} /> 목록으로
				</button>
				<div className="flex flex-wrap items-center gap-2">
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
					<Button
						variant="outline"
						iconStart={<FileClock size={16} />}
						onClick={() => setIsDraftListOpen(true)}
					>
						임시저장 목록
					</Button>
					<Button
						variant="outline"
						onClick={() => save("draft")}
						disabled={saving}
						title={`임시저장 글은 ${DRAFT_RETENTION_DAYS}일간 보관됩니다`}
					>
						임시저장
					</Button>
					<Button variant="primary" onClick={() => save("published")} disabled={saving}>
						{saving ? "저장 중…" : "발행"}
					</Button>
				</div>
				<div className="w-full text-[12px] text-muted-foreground sm:text-right">
					임시저장 글은 마지막 저장일로부터 {DRAFT_RETENTION_DAYS}일간 보관되고, 이후 자동
					삭제됩니다.
				</div>
			</div>
			{error && (
				<div className="mb-4 shrink-0 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-destructive text-sm">
					{error}
				</div>
			)}

			{/* 좌: 작성/미리보기(길게) · 우: 발행 설정 */}
			<div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_360px]">
				<div className="flex min-h-0 flex-col">
					{/* 작성 모드 — 제목 + 리치 에디터(항상 마운트 유지: 저장 시 HTML 읽기) */}
					<div
						className={
							mode === "write"
								? "flex min-h-[60vh] flex-col overflow-hidden rounded-md border border-border bg-card lg:min-h-0 lg:flex-1"
								: "hidden"
						}
					>
						<input
							value={title}
							onChange={(e) => handleTitleChange(e.target.value)}
							placeholder="제목을 입력하세요"
							className="w-full border-border border-b px-4 py-4 font-bold text-foreground text-xl tracking-[-0.02em] outline-none placeholder:text-muted-foreground sm:px-6 sm:py-5 sm:text-2xl"
						/>
						<div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-6">
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
						<div className="min-h-[60vh] overflow-y-auto rounded-md border border-border bg-card px-4 py-6 sm:px-8 sm:py-8 lg:min-h-0 lg:flex-1">
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
				<div className="flex flex-col gap-4 pr-1 lg:min-h-0 lg:overflow-y-auto">
					<div className="rounded-md border border-border bg-card p-5">
						<div className="mb-3 font-bold text-foreground text-sm">기본</div>
						<div className="mb-4">
							<Label htmlFor="be-cat">카테고리</Label>
							{/* items 를 넘겨야 트리거에 id 대신 카테고리 이름이 표시된다(Base UI) */}
							<Select
								items={categories.map((c) => ({ value: c.id, label: c.name }))}
								value={categoryId}
								onValueChange={(v) => setCategoryId(v ?? "")}
							>
								<SelectTrigger id="be-cat" className="w-full">
									<SelectValue placeholder="선택하세요" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
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
									{/* 홈페이지 썸네일은 1:1(목록·카드 공통) — 미리보기 비율을 실제와 맞춘다.
									    커버는 목록 썸네일과 공유(og) 이미지로만 쓰이고, 상세 상단에는 노출되지 않는다
									    (본문 첫 이미지와 중복되므로). */}
									<img
										src={coverUrl}
										alt={coverAlt || "커버 미리보기"}
										className="aspect-square w-full rounded-md border border-border object-cover"
									/>
									<p className="mt-1 mb-2 text-[12px] text-muted-foreground">
										목록 썸네일 비율(1:1) 미리보기
									</p>
								</>
							)}
							<p className="mb-2 text-[12px] text-muted-foreground">
								정사각(1:1) 이미지 권장 · 550px 이상. 목록 썸네일과 카카오톡·검색 공유 이미지로
								쓰입니다.
							</p>
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

			{isDraftListOpen && (
				<DraftListModal
					currentPostId={post?.id}
					onClose={() => setIsDraftListOpen(false)}
					onOpen={(postId) => {
						if (
							isDirty &&
							!confirm("작성 중인 내용이 있습니다. 저장하지 않고 다른 글로 이동할까요?")
						)
							return;
						setIsDraftListOpen(false);
						onOpenPost(postId);
					}}
				/>
			)}
		</div>
	);
};
