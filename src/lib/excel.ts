import dayjs from "dayjs";
import { CONTACT_FIELDS } from "@/config/contact-fields";
import { formatDateFull } from "@/lib/format";
import type { Contact } from "@/types/database";

// xlsx는 701KB로 크므로 버튼 클릭 시점에 동적 로드
export const exportContactsToExcel = async (contacts: Contact[]) => {
	try {
		const XLSX = await import("xlsx");

		const data = contacts.map((c) => ({
			접수일시: formatDateFull(c.created_at),
			...Object.fromEntries(
				CONTACT_FIELDS.map((f) => [f.label, String(c[f.key as keyof Contact] ?? "")]),
			),
		}));

		const ws = XLSX.utils.json_to_sheet(data);

		ws["!cols"] = [{ wch: 24 }, ...CONTACT_FIELDS.map((f) => ({ wch: f.excelWidth }))];

		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "문의목록");
		XLSX.writeFile(wb, `문의목록_${dayjs().format("YYYY-MM-DD")}.xlsx`);
	} catch (error) {
		console.error("엑셀 내보내기 실패:", error);
	}
};
