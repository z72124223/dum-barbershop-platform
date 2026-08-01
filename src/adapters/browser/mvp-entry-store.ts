import {
  hasMvpBookingConflict,
  parseMvpScheduleEntries,
  sortMvpScheduleEntries,
  validateMvpScheduleEntry,
  type MvpScheduleEntry,
} from "../../domain/mvp";

export const MVP_SCHEDULE_ENTRIES_STORAGE_KEY = "dum_mvp_schedule_entries_v1";
export const MVP_SCHEDULE_ENTRIES_CHANGED_EVENT =
  "dum:mvp-schedule-entries-changed";

export type MvpEntryStoreFailureReason =
  | "storage_unavailable"
  | "invalid_data"
  | "invalid_entry"
  | "duplicate_id"
  | "booking_conflict"
  | "not_found";

export type MvpEntryStoreResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: MvpEntryStoreFailureReason };

export interface MvpEntryStoreChangedDetail {
  key: typeof MVP_SCHEDULE_ENTRIES_STORAGE_KEY;
  operation: "add" | "update" | "remove";
  entryId: string;
}

interface MvpEntryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface BrowserMvpEntryStoreOptions {
  storage?: MvpEntryStorage | null;
  eventTarget?: EventTarget | null;
}

export class BrowserMvpEntryStore {
  private readonly hasInjectedStorage: boolean;
  private readonly hasInjectedEventTarget: boolean;

  constructor(private readonly options: BrowserMvpEntryStoreOptions = {}) {
    this.hasInjectedStorage = Object.prototype.hasOwnProperty.call(
      options,
      "storage",
    );
    this.hasInjectedEventTarget = Object.prototype.hasOwnProperty.call(
      options,
      "eventTarget",
    );
  }

  list(): MvpEntryStoreResult<MvpScheduleEntry[]> {
    const storage = this.resolveStorage();
    if (!storage) return { ok: false, reason: "storage_unavailable" };

    let raw: string | null;
    try {
      raw = storage.getItem(MVP_SCHEDULE_ENTRIES_STORAGE_KEY);
    } catch {
      return { ok: false, reason: "storage_unavailable" };
    }
    if (raw === null) return { ok: true, value: [] };

    try {
      const parsed = parseMvpScheduleEntries(JSON.parse(raw));
      if (!parsed) return { ok: false, reason: "invalid_data" };
      return { ok: true, value: sortMvpScheduleEntries(parsed) };
    } catch {
      return { ok: false, reason: "invalid_data" };
    }
  }

  add(value: unknown): MvpEntryStoreResult<MvpScheduleEntry> {
    const validated = validateMvpScheduleEntry(value);
    if (!validated.ok) return { ok: false, reason: "invalid_entry" };

    const current = this.list();
    if (!current.ok) return current;
    if (current.value.some((entry) => entry.id === validated.entry.id)) {
      return { ok: false, reason: "duplicate_id" };
    }
    if (
      validated.entry.kind === "booking"
      && hasMvpBookingConflict(current.value, validated.entry)
    ) {
      return { ok: false, reason: "booking_conflict" };
    }

    const saved = this.write(
      [...current.value, validated.entry],
      "add",
      validated.entry.id,
    );
    return saved.ok ? { ok: true, value: validated.entry } : saved;
  }

  update(value: unknown): MvpEntryStoreResult<MvpScheduleEntry> {
    const validated = validateMvpScheduleEntry(value);
    if (!validated.ok) return { ok: false, reason: "invalid_entry" };

    const current = this.list();
    if (!current.ok) return current;
    const index = current.value.findIndex(
      (entry) => entry.id === validated.entry.id,
    );
    if (index < 0) return { ok: false, reason: "not_found" };
    if (
      validated.entry.kind === "booking"
      && hasMvpBookingConflict(
        current.value,
        validated.entry,
        validated.entry.id,
      )
    ) {
      return { ok: false, reason: "booking_conflict" };
    }

    const next = [...current.value];
    next[index] = validated.entry;
    const saved = this.write(next, "update", validated.entry.id);
    return saved.ok ? { ok: true, value: validated.entry } : saved;
  }

  remove(id: string): MvpEntryStoreResult<MvpScheduleEntry> {
    const normalizedId = typeof id === "string" ? id.trim() : "";
    if (!normalizedId) return { ok: false, reason: "invalid_entry" };

    const current = this.list();
    if (!current.ok) return current;
    const existing = current.value.find((entry) => entry.id === normalizedId);
    if (!existing) return { ok: false, reason: "not_found" };

    const saved = this.write(
      current.value.filter((entry) => entry.id !== normalizedId),
      "remove",
      normalizedId,
    );
    return saved.ok ? { ok: true, value: existing } : saved;
  }

  private write(
    entries: readonly MvpScheduleEntry[],
    operation: MvpEntryStoreChangedDetail["operation"],
    entryId: string,
  ): MvpEntryStoreResult<MvpScheduleEntry[]> {
    const storage = this.resolveStorage();
    if (!storage) return { ok: false, reason: "storage_unavailable" };

    const sorted = sortMvpScheduleEntries(entries);
    try {
      storage.setItem(
        MVP_SCHEDULE_ENTRIES_STORAGE_KEY,
        JSON.stringify(sorted),
      );
    } catch {
      return { ok: false, reason: "storage_unavailable" };
    }

    this.dispatchChanged({ key: MVP_SCHEDULE_ENTRIES_STORAGE_KEY, operation, entryId });
    return { ok: true, value: sorted };
  }

  private resolveStorage(): MvpEntryStorage | null {
    if (this.hasInjectedStorage) return this.options.storage ?? null;
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  private resolveEventTarget(): EventTarget | null {
    if (this.hasInjectedEventTarget) return this.options.eventTarget ?? null;
    return typeof window === "undefined" ? null : window;
  }

  private dispatchChanged(detail: MvpEntryStoreChangedDetail): void {
    const target = this.resolveEventTarget();
    if (!target) return;

    try {
      target.dispatchEvent(
        new CustomEvent<MvpEntryStoreChangedDetail>(
          MVP_SCHEDULE_ENTRIES_CHANGED_EVENT,
          { detail },
        ),
      );
    } catch {
      // Persistence succeeded; event delivery is best effort.
    }
  }
}
