import { DomainError, type IsoDate, type LocalTime } from "../models";

const TAIPEI_OFFSET = "+08:00";

export function toTaipeiInstant(date: IsoDate, time: LocalTime): Date {
  const value = new Date(`${date}T${time}:00${TAIPEI_OFFSET}`);
  if (Number.isNaN(value.getTime())) {
    throw new DomainError("INVALID_DATE", `Invalid Asia/Taipei date or time: ${date} ${time}`);
  }
  return value;
}

export function dayOfWeekInTaipei(date: IsoDate): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const noon = new Date(`${date}T12:00:00${TAIPEI_OFFSET}`);
  if (Number.isNaN(noon.getTime())) {
    throw new DomainError("INVALID_DATE", `Invalid date: ${date}`);
  }
  return noon.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export function addMinutes(value: Date, minutes: number): Date {
  return new Date(value.getTime() + minutes * 60_000);
}

export function subtractMinutes(value: Date, minutes: number): Date {
  return addMinutes(value, -minutes);
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export function formatTaipeiTime(value: Date): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}
