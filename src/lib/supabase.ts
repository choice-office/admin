import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경변수 없으면 더미값으로 클라이언트 생성 (UI 미리보기용)
// 실제 API 호출은 실패하지만 화면은 렌더링됨
export const supabase = createClient<Database>(
	supabaseUrl ?? "https://placeholder.supabase.co",
	supabaseAnonKey ?? "placeholder-anon-key",
);

export const isMockMode = !supabaseUrl || !supabaseAnonKey;
