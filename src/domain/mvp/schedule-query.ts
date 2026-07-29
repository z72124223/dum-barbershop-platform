import type { MvpScheduleEntry } from "./schedule-entry";
import {
  getTaipeiClockSnapshot,
  isTaipeiCalendarDate,
} from "./taipei-time";

export type MvpScheduleQueryKind = "all" | MvpScheduleEntry["kind"];

export interface MvpPastScheduleQuery {
  fromDate: string;
  toDate: string;
  staffId?: string;
  kind?: MvpScheduleQueryKind;
  now: Date;
}

export type MvpPastScheduleQueryError =
  | "invalid_from_date"
  | "invalid_to_date"
  | "invalid_range";

export type MvpPastScheduleQueryResult =
  | { ok: true; entries: MvpScheduleEntry[] }
  | { ok: false; error: MvpPastScheduleQueryError };

function hasStarted(
  entry: MvpScheduleEntry,
  now: ReturnType<typeof getTaipeiClockSnapshot>,
): boolean {
  return entry.date < now.date
    || (entry.date === now.date && entry.startTime <= now.time);
}

function newestFirst(
  left: MvpScheduleEntry,
  right: MvpScheduleEntry,
): number {
  return right.date.localeCompare(left.date)
    || right.startTime.localeCompare(left.startTime)
    || left.kind.localeCompare(right.kind)
    || left.id.localeCompare(right.id);
}

export function queryPastMvpScheduleEntries(
  entries: readonly MvpScheduleEntry[],
  query: MvpPastScheduleQuery,
): MvpPastScheduleQueryResult {
  const fromDate = query.fromDate.trim();
  const toDate = query.toDate.trim();
  if (!isTaipeiCalendarDate(fromDate)) {
    return { ok: false, error: "invalid_from_date" };
  }
  if (!isTaipeiCalendarDate(toDate)) {
    return { ok: false, error: "invalid_to_date" };
  }
  if (fromDate > toDate) {
    return { ok: false, error: "invalid_range" };
  }

  const now = getTaipeiClockSnapshot(query.now);
  const staffId = query.staffId?.trim();
  const kind = query.kind ?? "all";

  const result = entries.filter((entry) =>
    entry.date >= fromDate
    && entry.date <= toDate
    && hasStarted(entry, now)
    && (!staffId || entry.staffId === staffId)
    && (kind === "all" || entry.kind === kind),
  );

  return { ok: true, entries: [...result].sort(newestFirst) };
}
