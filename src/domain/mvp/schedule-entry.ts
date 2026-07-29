export type MvpScheduleEntryDate = string;
export type MvpScheduleEntryTime = string;

interface MvpScheduleEntryBase {
  id: string;
  date: MvpScheduleEntryDate;
  startTime: MvpScheduleEntryTime;
  staffId: string;
  note: string;
  createdAt: string;
}

export interface MvpBookingScheduleEntry extends MvpScheduleEntryBase {
  kind: "booking";
  customerName: string;
  phone: string;
  source: "customer" | "staff";
}

export interface MvpNoteScheduleEntry extends MvpScheduleEntryBase {
  kind: "note";
  title: string;
  source: "staff";
}

export type MvpScheduleEntry =
  | MvpBookingScheduleEntry
  | MvpNoteScheduleEntry;

export type MvpScheduleEntryValidationError =
  | "invalid_shape"
  | "invalid_kind"
  | "invalid_id"
  | "invalid_date"
  | "invalid_start_time"
  | "invalid_staff_id"
  | "empty_note"
  | "invalid_created_at"
  | "invalid_source"
  | "empty_customer_name"
  | "empty_phone"
  | "empty_title";

export type MvpScheduleEntryValidationResult =
  | { ok: true; entry: MvpScheduleEntry }
  | { ok: false; error: MvpScheduleEntryValidationError };

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isMvpScheduleEntryDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function isMvpScheduleEntryTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function normalizeMvpScheduleEntry(
  entry: MvpScheduleEntry,
): MvpScheduleEntry {
  const common = {
    id: entry.id.trim(),
    date: entry.date.trim(),
    startTime: entry.startTime.trim(),
    staffId: entry.staffId.trim(),
    note: entry.note.trim(),
    createdAt: new Date(entry.createdAt.trim()).toISOString(),
  };

  if (entry.kind === "booking") {
    return {
      ...common,
      kind: "booking",
      customerName: entry.customerName.trim(),
      phone: entry.phone.trim(),
      source: entry.source,
    };
  }

  return {
    ...common,
    kind: "note",
    title: entry.title.trim(),
    source: "staff",
  };
}

export function validateMvpScheduleEntry(
  value: unknown,
): MvpScheduleEntryValidationResult {
  if (!isRecord(value)) return { ok: false, error: "invalid_shape" };
  if (value.kind !== "booking" && value.kind !== "note") {
    return { ok: false, error: "invalid_kind" };
  }

  if (typeof value.id !== "string" || !isNonEmpty(value.id)) {
    return { ok: false, error: "invalid_id" };
  }
  if (
    typeof value.date !== "string"
    || !isMvpScheduleEntryDate(value.date.trim())
  ) {
    return { ok: false, error: "invalid_date" };
  }
  if (
    typeof value.startTime !== "string"
    || !isMvpScheduleEntryTime(value.startTime.trim())
  ) {
    return { ok: false, error: "invalid_start_time" };
  }
  if (typeof value.staffId !== "string" || !isNonEmpty(value.staffId)) {
    return { ok: false, error: "invalid_staff_id" };
  }
  if (typeof value.note !== "string") {
    return { ok: false, error: "empty_note" };
  }
  if (
    typeof value.createdAt !== "string"
    || !isNonEmpty(value.createdAt)
    || !Number.isFinite(new Date(value.createdAt).getTime())
  ) {
    return { ok: false, error: "invalid_created_at" };
  }

  if (value.kind === "booking") {
    if (
      typeof value.customerName !== "string"
      || !isNonEmpty(value.customerName)
    ) {
      return { ok: false, error: "empty_customer_name" };
    }
    if (typeof value.phone !== "string" || !isNonEmpty(value.phone)) {
      return { ok: false, error: "empty_phone" };
    }
    if (value.source !== "customer" && value.source !== "staff") {
      return { ok: false, error: "invalid_source" };
    }

    return {
      ok: true,
      entry: normalizeMvpScheduleEntry({
        id: value.id,
        kind: "booking",
        date: value.date,
        startTime: value.startTime,
        staffId: value.staffId,
        note: value.note,
        createdAt: value.createdAt,
        customerName: value.customerName,
        phone: value.phone,
        source: value.source,
      }),
    };
  }

  if (typeof value.title !== "string" || !isNonEmpty(value.title)) {
    return { ok: false, error: "empty_title" };
  }
  if (!isNonEmpty(value.note)) {
    return { ok: false, error: "empty_note" };
  }
  if (value.source !== "staff") {
    return { ok: false, error: "invalid_source" };
  }

  return {
    ok: true,
    entry: normalizeMvpScheduleEntry({
      id: value.id,
      kind: "note",
      date: value.date,
      startTime: value.startTime,
      staffId: value.staffId,
      note: value.note,
      createdAt: value.createdAt,
      title: value.title,
      source: value.source,
    }),
  };
}

export function parseMvpScheduleEntries(
  value: unknown,
): MvpScheduleEntry[] | null {
  if (!Array.isArray(value)) return null;

  const entries: MvpScheduleEntry[] = [];
  for (const item of value) {
    const result = validateMvpScheduleEntry(item);
    if (!result.ok) return null;
    entries.push(result.entry);
  }
  return entries;
}

export function sortMvpScheduleEntries(
  entries: readonly MvpScheduleEntry[],
): MvpScheduleEntry[] {
  return [...entries].sort((left, right) =>
    left.date.localeCompare(right.date)
    || left.startTime.localeCompare(right.startTime)
    || left.kind.localeCompare(right.kind)
    || left.createdAt.localeCompare(right.createdAt)
    || left.id.localeCompare(right.id),
  );
}

export function filterMvpScheduleEntriesByStaff(
  entries: readonly MvpScheduleEntry[],
  staffId: string,
): MvpScheduleEntry[] {
  const normalizedStaffId = staffId.trim();
  if (!normalizedStaffId) return [];
  return entries.filter((entry) => entry.staffId === normalizedStaffId);
}

export function hasMvpBookingConflict(
  entries: readonly MvpScheduleEntry[],
  candidate: MvpBookingScheduleEntry,
  excludeEntryId?: string,
): boolean {
  const normalized = normalizeMvpScheduleEntry(candidate);
  if (normalized.kind !== "booking") return false;

  return entries.some((entry) =>
    entry.kind === "booking"
    && entry.id !== excludeEntryId
    && entry.staffId === normalized.staffId
    && entry.date === normalized.date
    && entry.startTime === normalized.startTime,
  );
}
