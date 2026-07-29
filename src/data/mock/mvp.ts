import type { MvpScheduleEntry } from "../../domain/mvp";
import { isMvpScheduleEntryDate, sortMvpScheduleEntries } from "../../domain/mvp";

function taipeiToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function createMockMvpScheduleEntries(
  baseDate: string = taipeiToday(),
): MvpScheduleEntry[] {
  const date = baseDate.trim();
  if (!isMvpScheduleEntryDate(date)) {
    throw new TypeError("baseDate must use a real YYYY-MM-DD calendar date.");
  }

  return sortMvpScheduleEntries([
    {
      id: `mvp-booking-alpha-${date}`,
      kind: "booking",
      date,
      startTime: "10:00",
      staffId: "staff-mock-alpha",
      note: "虛構預約：到店後再確認需求。",
      createdAt: `${date}T00:30:00.000Z`,
      customerName: "虛構客人甲",
      phone: "0900-000-101",
      source: "customer",
    },
    {
      id: `mvp-note-alpha-${date}`,
      kind: "note",
      date,
      startTime: "11:30",
      staffId: "staff-mock-alpha",
      note: "虛構註記：確認工作區用品。",
      createdAt: `${date}T00:35:00.000Z`,
      title: "現場提醒",
      source: "staff",
    },
    {
      id: `mvp-booking-bravo-${date}`,
      kind: "booking",
      date,
      startTime: "13:00",
      staffId: "staff-mock-bravo",
      note: "虛構預約：由職員手動建立。",
      createdAt: `${date}T00:40:00.000Z`,
      customerName: "虛構客人乙",
      phone: "0900-000-202",
      source: "staff",
    },
    {
      id: `mvp-note-bravo-${date}`,
      kind: "note",
      date,
      startTime: "15:00",
      staffId: "staff-mock-bravo",
      note: "虛構註記：保留時間確認現場事項。",
      createdAt: `${date}T00:45:00.000Z`,
      title: "職員註記",
      source: "staff",
    },
  ]);
}
