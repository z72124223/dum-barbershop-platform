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

export function taipeiToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function upcomingTaipeiDates(count = 7, from = taipeiToday()): string[] {
  const start = new Date(`${from}T12:00:00+08:00`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  });
}

export function formatMvpDate(date: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T12:00:00+08:00`));
}

export function staffLabel(staffId: string): string {
  return MVP_STAFF_OPTIONS.find((staff) => staff.id === staffId)?.label ?? "未指定職員";
}
