import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MOCK_CONTACTS } from "@/data/mock-contacts";
import { loadReadIds, saveReadId } from "@/lib/read-status";
import { isMockMode, supabase } from "@/lib/supabase";
import type { Contact } from "@/types/database";

export const useContacts = () => {
	const navigate = useNavigate();
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (isMockMode) {
			const readIds = loadReadIds();
			setContacts(MOCK_CONTACTS.map((c) => ({ ...c, is_read: readIds.has(c.id) })));
			setIsLoading(false);
			return;
		}

		const fetchContacts = async () => {
			const { data, error } = await supabase
				.from("contacts")
				.select("*")
				.order("created_at", { ascending: false });
			if (error) console.error("문의 조회 실패:", error.message);
			else setContacts((data ?? []).map((c) => ({ ...c, is_read: c.is_read ?? false })));
			setIsLoading(false);
		};
		fetchContacts();
	}, []);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		navigate({ to: "/login" });
	};

	// 낙관적 업데이트: 즉시 읽음 처리 후 Supabase 동기화, 실패 시 롤백
	const markAsRead = async (contact: Contact) => {
		if (contact.is_read) return;
		setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, is_read: true } : c)));
		if (isMockMode) {
			saveReadId(contact.id);
		} else {
			const { error } = await supabase
				.from("contacts")
				.update({ is_read: true })
				.eq("id", contact.id);
			if (error) {
				// 동기화 실패 시 UI를 원래 상태로 복구
				setContacts((prev) =>
					prev.map((c) => (c.id === contact.id ? { ...c, is_read: false } : c)),
				);
				console.error("읽음 처리 실패:", error.message);
			}
		}
	};

	return { contacts, isLoading, markAsRead, handleLogout };
};
