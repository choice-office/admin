// 업로드 검증 — 종류·용량 화이트리스트.
//
// 왜: 스토리지 버킷이 공개 읽기라, 검증 없이 올리면 임의 파일이 공개 URL 로 배포된다
//     (악성 파일·피싱 문서 유포에 악용되면 도메인·프로젝트 평판 문제). 용량 상한이 없으면 과금도 문제.
// 원칙: 실제로 쓰는 형식은 전부 허용해 기존 작업이 막히지 않게 하고, 실행·스크립트 계열만 차단한다.
//       (SVG 는 스크립트를 품을 수 있어 이미지에서 제외 — 사무소 업무상 SVG 업로드 사례 없음)
// 버킷에도 20MB 상한이 걸려 있어(2026-07-30 authz 정리) 아래 값은 그보다 작게 잡는다.

const IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/avif",
	"image/bmp",
	"image/tiff",
	"image/heic",
	"image/heif",
];

// 첨부 — 행정 업무에서 실제로 쓰는 문서 형식 + 이미지
const FILE_TYPES = [
	...IMAGE_TYPES,
	"application/pdf",
	"application/haansofthwp", // hwp
	"application/x-hwp",
	"application/vnd.hancom.hwp",
	"application/vnd.hancom.hwpx",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"text/plain",
	"text/csv",
	"application/zip",
	"application/x-zip-compressed",
];

// 확장자 차단 목록 — MIME 이 비거나(hwp 등 브라우저가 모르는 형식) 위장된 경우의 2차 방어
const BLOCKED_EXTENSIONS = [
	"html",
	"htm",
	"xhtml",
	"svg",
	"js",
	"mjs",
	"jsx",
	"json",
	"xml",
	"swf",
	"exe",
	"msi",
	"bat",
	"cmd",
	"com",
	"scr",
	"cpl",
	"dll",
	"sh",
	"bash",
	"zsh",
	"app",
	"dmg",
	"pkg",
	"jar",
	"apk",
	"vbs",
	"ps1",
	"php",
	"asp",
	"aspx",
	"jsp",
];

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB (리사이즈 전 원본 기준)
const MAX_FILE_BYTES = 19 * 1024 * 1024; // 19MB (버킷 상한 20MB 보다 낮게)

const mb = (bytes: number) => `${Math.round((bytes / 1024 / 1024) * 10) / 10}MB`;

/** 통과하면 null, 막으면 사용자에게 보여줄 한국어 메시지를 반환한다. */
export const checkUpload = (file: File, kind: "image" | "file"): string | null => {
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	if (BLOCKED_EXTENSIONS.includes(ext)) {
		return `.${ext} 형식은 보안상 업로드할 수 없습니다.`;
	}
	const limit = kind === "image" ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
	if (file.size > limit) {
		return `파일이 너무 큽니다. ${mb(file.size)} → ${mb(limit)} 이하로 줄여 주세요.`;
	}
	const allowed = kind === "image" ? IMAGE_TYPES : FILE_TYPES;
	// MIME 이 빈 값이면(브라우저가 모르는 형식) 확장자 차단 목록만으로 판정한다 — hwp 등 정상 업무 파일 보호
	if (file.type && !allowed.includes(file.type.toLowerCase())) {
		return kind === "image"
			? `이미지 형식(${file.type})은 업로드할 수 없습니다. JPG·PNG·WEBP 를 사용해 주세요.`
			: `이 형식(${file.type})은 업로드할 수 없습니다. 문서(PDF·HWP·DOC·XLS)나 이미지만 가능합니다.`;
	}
	return null;
};
