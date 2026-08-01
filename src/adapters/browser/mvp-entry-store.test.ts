import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  MvpBookingScheduleEntry,
  MvpNoteScheduleEntry,
} from "../../domain/mvp";
import {
  BrowserMvpEntryStore,
  MVP_SCHEDULE_ENTRIES_CHANGED_EVENT,
  MVP_SCHEDULE_ENTRIES_STORAGE_KEY,
  type MvpEntryStoreChangedDetail,
} from "./mvp-entry-store";

class MemoryStorage {
  readonly values = new Map<string, string>();
  failGet = false;
  failSet = false;

  getItem(key: string): string | null {
    if (this.failGet) throw new Error("storage get unavailable");
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failSet) throw new Error("storage set unavailable");
    this.values.set(key, value);
  }
}

const booking: MvpBookingScheduleEntry = {
  id: "booking-store-one",
  kind: "booking",
  date: "2026-07-29",
  startTime: "10:00",
  staffId: "staff-mock-alpha",
  note: "確認長度",
  createdAt: "2026-07-29T01:00:00.000Z",
  customerName: "虛構客人",
  phone: "0900-000-001",
  source: "customer",
};

const note: MvpNoteScheduleEntry = {
  id: "note-store-one",
  kind: "note",
  date: "2026-07-29",
  startTime: "10:00",
  staffId: "staff-mock-alpha",
  note: "此註記不封鎖預約",
  createdAt: "2026-07-29T01:05:00.000Z",
  title: "現場提醒",
  source: "staff",
};

describe("BrowserMvpEntryStore", () => {
  it("reports unavailable storage without throwing", () => {
    const store = new BrowserMvpEntryStore({
      storage: null,
      eventTarget: null,
    });
    assert.deepEqual(store.list(), {
      ok: false,
      reason: "storage_unavailable",
    });

    const failingStorage = new MemoryStorage();
    failingStorage.failGet = true;
    assert.deepEqual(
      new BrowserMvpEntryStore({ storage: failingStorage }).list(),
      { ok: false, reason: "storage_unavailable" },
    );
  });

  it("rejects malformed JSON and invalid stored schema", () => {
    const storage = new MemoryStorage();
    storage.values.set(MVP_SCHEDULE_ENTRIES_STORAGE_KEY, "{bad-json");
    const store = new BrowserMvpEntryStore({ storage });
    assert.deepEqual(store.list(), { ok: false, reason: "invalid_data" });

    storage.values.set(
      MVP_SCHEDULE_ENTRIES_STORAGE_KEY,
      JSON.stringify([{ ...booking, date: "2026-02-30" }]),
    );
    assert.deepEqual(store.list(), { ok: false, reason: "invalid_data" });
  });

  it("normalizes additions and dispatches a same-page event", () => {
    const storage = new MemoryStorage();
    const target = new EventTarget();
    const details: MvpEntryStoreChangedDetail[] = [];
    target.addEventListener(MVP_SCHEDULE_ENTRIES_CHANGED_EVENT, (event) => {
      details.push((event as CustomEvent<MvpEntryStoreChangedDetail>).detail);
    });
    const store = new BrowserMvpEntryStore({ storage, eventTarget: target });

    const result = store.add({
      ...booking,
      customerName: " 虛構客人 ",
      note: " 確認長度 ",
    });
    assert.equal(result.ok, true);
    if (!result.ok || result.value.kind !== "booking") return;
    assert.equal(result.value.customerName, "虛構客人");
    assert.equal(result.value.note, "確認長度");
    assert.deepEqual(details, [{
      key: MVP_SCHEDULE_ENTRIES_STORAGE_KEY,
      operation: "add",
      entryId: booking.id,
    }]);
  });

  it("blocks only conflicting bookings and allows notes at the same time", () => {
    const storage = new MemoryStorage();
    const store = new BrowserMvpEntryStore({ storage });
    assert.equal(store.add(booking).ok, true);
    assert.deepEqual(
      store.add({ ...booking, id: "booking-conflict" }),
      { ok: false, reason: "booking_conflict" },
    );
    assert.equal(store.add(note).ok, true);
    const listed = store.list();
    assert.equal(listed.ok, true);
    if (listed.ok) assert.equal(listed.value.length, 2);
  });

  it("updates and removes existing entries", () => {
    const storage = new MemoryStorage();
    const store = new BrowserMvpEntryStore({ storage });
    assert.equal(store.add(booking).ok, true);

    const updated = store.update({ ...booking, note: "更新後備註" });
    assert.equal(updated.ok, true);
    if (updated.ok) assert.equal(updated.value.note, "更新後備註");

    const removed = store.remove(` ${booking.id} `);
    assert.equal(removed.ok, true);
    assert.deepEqual(store.list(), { ok: true, value: [] });
    assert.deepEqual(store.remove(booking.id), { ok: false, reason: "not_found" });
  });

  it("reports write failures and does not emit an event", () => {
    const storage = new MemoryStorage();
    storage.failSet = true;
    const target = new EventTarget();
    let eventCount = 0;
    target.addEventListener(
      MVP_SCHEDULE_ENTRIES_CHANGED_EVENT,
      () => { eventCount += 1; },
    );
    const store = new BrowserMvpEntryStore({ storage, eventTarget: target });

    assert.deepEqual(store.add(booking), {
      ok: false,
      reason: "storage_unavailable",
    });
    assert.equal(eventCount, 0);
  });
});
