import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Contact, ContactStatus } from "@/types/database";

// 상담 문의 목록 조회 + 상태/메모 수정(낙관적 업데이트). RLS authenticated 정책으로 접근.
export const useContacts = () => {
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const refetch = useCallback(async () => {
		setIsLoading(true);
		const { data, error } = await supabase
			.from("contacts")
			.select("*")
			.order("created_at", { ascending: false });
		if (error) console.error("문의 조회 실패:", error.message);
		else setContacts((data ?? []) as Contact[]);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		refetch();
	}, [refetch]);

	const updateContact = async (
		id: string,
		patch: { status?: ContactStatus; memo?: string | null },
	): Promise<boolean> => {
		setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
		const { error } = await supabase.from("contacts").update(patch).eq("id", id);
		if (error) {
			console.error("문의 수정 실패:", error.message);
			await refetch();
			return false;
		}
		return true;
	};

	return { contacts, isLoading, refetch, updateContact };
};
