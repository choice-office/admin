import type { User } from "@supabase/supabase-js";

// 관리자 아이디(표시 이름) ↔ Supabase 로그인 이메일 매핑 단일 출처.
// Supabase Auth는 이메일 기반이라 로그인할 때 아이디를 이메일로 바꾸고(resolveLoginEmail),
// 화면에 이름을 보여줄 때는 반대 방향으로 되돌린다(adminDisplayName).
// 새 관리자를 추가하면 여기에 한 줄 넣으면 된다.
export const ADMIN_ALIASES: Record<string, string> = {
	최서연: "seoyeon@kvisa1345.com",
};

export const resolveLoginEmail = (id: string): string => ADMIN_ALIASES[id.trim()] ?? id.trim();

const nameByEmail = (email: string): string | undefined =>
	Object.keys(ADMIN_ALIASES).find((name) => ADMIN_ALIASES[name].toLowerCase() === email);

// 표시 이름 — 계정 메타데이터(name) > 아이디 별칭 역매핑 > 이메일 아이디 부분.
// admin 처럼 사람 이름이 아닌 계정은 '관리자'로 둔다.
export const adminDisplayName = (user: Pick<User, "email" | "user_metadata"> | null): string => {
	const email = (user?.email ?? "").trim().toLowerCase();
	const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
	const metaName = typeof meta.name === "string" ? meta.name.trim() : "";
	if (metaName) return metaName;
	const alias = nameByEmail(email);
	if (alias) return alias;
	const local = email.split("@")[0] ?? "";
	return !local || local === "admin" ? "관리자" : local;
};
