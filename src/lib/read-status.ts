// Mock 모드 전용 — 실제 운영 모드에서는 Supabase contacts.is_read 컬럼 사용
const STORAGE_KEY = "admin_read_contacts";

export const loadReadIds = (): Set<string> => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return new Set(raw ? (JSON.parse(raw) as string[]) : []);
	} catch (e) {
		console.error("읽음 상태 로드 실패:", e);
		return new Set();
	}
};

export const saveReadId = (id: string): void => {
	try {
		const current = loadReadIds();
		current.add(id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...current]));
	} catch (e) {
		console.error("읽음 상태 저장 실패:", e);
	}
};
