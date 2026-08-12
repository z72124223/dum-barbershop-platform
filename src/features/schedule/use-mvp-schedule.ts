"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrowserMvpEntryStore,
  MVP_SCHEDULE_ENTRIES_CHANGED_EVENT,
  MVP_SCHEDULE_ENTRIES_STORAGE_KEY,
  type MvpEntryStoreFailureReason,
} from "@/adapters/browser/mvp-entry-store";
import { createMockMvpScheduleEntries } from "@/data/mock/mvp";
import type { MvpScheduleEntry } from "@/domain";

interface MvpScheduleState {
  entries: MvpScheduleEntry[];
  ready: boolean;
  failure: MvpEntryStoreFailureReason | null;
  addEntry(value: unknown): { ok: true; entry: MvpScheduleEntry } | { ok: false; reason: MvpEntryStoreFailureReason };
  updateEntry(value: unknown): { ok: true; entry: MvpScheduleEntry } | { ok: false; reason: MvpEntryStoreFailureReason };
}

export function useMvpSchedule(): MvpScheduleState {
  const store = useMemo(() => new BrowserMvpEntryStore(), []);
  const [entries, setEntries] = useState<MvpScheduleEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<MvpEntryStoreFailureReason | null>(null);

  const reload = useCallback(() => {
    let shouldSeed = false;
    try {
      shouldSeed = window.localStorage.getItem(MVP_SCHEDULE_ENTRIES_STORAGE_KEY) === null;
    } catch {
      setFailure("storage_unavailable");
      setReady(true);
      return;
    }

    if (shouldSeed) {
      for (const entry of createMockMvpScheduleEntries()) {
        const seeded = store.add(entry);
        if (!seeded.ok) {
          setFailure(seeded.reason);
          setReady(true);
          return;
        }
      }
    }

    const result = store.list();
    if (!result.ok) {
      setFailure(result.reason);
      setReady(true);
      return;
    }
    setEntries(result.value);
    setFailure(null);
    setReady(true);
  }, [store]);

  useEffect(() => {
    const initialLoad = window.setTimeout(reload, 0);
    const onStorage = (event: StorageEvent) => {
      if (event.key === MVP_SCHEDULE_ENTRIES_STORAGE_KEY) reload();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(MVP_SCHEDULE_ENTRIES_CHANGED_EVENT, reload);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MVP_SCHEDULE_ENTRIES_CHANGED_EVENT, reload);
    };
  }, [reload]);

  const addEntry = useCallback((value: unknown) => {
    const result = store.add(value);
    if (!result.ok) {
      setFailure(result.reason);
      return result;
    }
    setFailure(null);
    return { ok: true as const, entry: result.value };
  }, [store]);

  const updateEntry = useCallback((value: unknown) => {
    const result = store.update(value);
    if (!result.ok) {
      setFailure(result.reason);
      return result;
    }
    setFailure(null);
    return { ok: true as const, entry: result.value };
  }, [store]);

  return { entries, ready, failure, addEntry, updateEntry };
}
