import {
  addTaipeiCalendarDays,
  formatTaipeiDate,
  isTaipeiSlotPast,
  taipeiToday,
  upcomingTaipeiDates,
} from "@/domain";

export const MVP_STAFF_OPTIONS = [
  {
    id: "staff-mock-alpha",
    label: "老闆（虛構）",
    shortLabel: "老闆",
  },
  {
    id: "staff-mock-bravo",
    label: "職員（虛構）",
    shortLabel: "職員",
  },
] as const;

export const MVP_TIME_OPTIONS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

export { isTaipeiSlotPast, taipeiToday, upcomingTaipeiDates };

export function formatMvpDate(date: string): string {
  return formatTaipeiDate(date);
}

export function nextMvpScheduleSlot(now = new Date()): {
  date: string;
  time: string;
} {
  const today = taipeiToday(now);
  const availableToday = MVP_TIME_OPTIONS.find(
    (time) => !isTaipeiSlotPast(today, time, now),
  );

  if (availableToday) return { date: today, time: availableToday };
  return {
    date: addTaipeiCalendarDays(today, 1),
    time: MVP_TIME_OPTIONS[0],
  };
}

export function staffLabel(staffId: string): string {
  return MVP_STAFF_OPTIONS.find((staff) => staff.id === staffId)?.label ?? "未指定職員";
}
