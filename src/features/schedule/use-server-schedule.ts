"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  SafeScheduleHttpError,
  StaffScheduleDto,
  StaffScheduleEntryDto,
} from "@/domain/schedule";

export type ServerScheduleFailure = SafeScheduleHttpError["error"] | "network_error";

async function requestJson<T>(url: string, init?: RequestInit): Promise<
  { ok: true; value: T } | { ok: false; reason: ServerScheduleFailure }
> {
  try {
    const response = await fetch(url, { ...init, cache: "no-store" });
    const body = await response.json() as T | SafeScheduleHttpError;
    if (!response.ok) {
      return { ok: false, reason: (body as SafeScheduleHttpError).error ?? "service_unavailable" };
    }
    return { ok: true, value: body as T };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

export function useServerSchedule() {
  const [data, setData] = useState<StaffScheduleDto>({
    timezone: "Asia/Taipei",
    staff: [],
    entries: [],
  });
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<ServerScheduleFailure | null>(null);

  const reload = useCallback(async () => {
    const result = await requestJson<StaffScheduleDto>("/api/staff/schedule", {
      headers: { accept: "application/json" },
    });
    if (result.ok) {
      setData(result.value);
      setFailure(null);
    } else {
      setFailure(result.reason);
    }
    setReady(true);
    return result;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void requestJson<StaffScheduleDto>("/api/staff/schedule", {
      headers: { accept: "application/json" },
    }).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setData(result.value);
        setFailure(null);
      } else {
        setFailure(result.reason);
      }
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  const createBooking = useCallback(async (input: Record<string, string>) => {
    const result = await requestJson<{ entryId: string }>("/api/staff/schedule/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (result.ok) await reload();
    return result;
  }, [reload]);

  const createNote = useCallback(async (input: Record<string, string>) => {
    const result = await requestJson<{ entryId: string }>("/api/staff/schedule/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (result.ok) await reload();
    return result;
  }, [reload]);

  const updateNote = useCallback(async (
    entry: StaffScheduleEntryDto,
    note: string,
  ) => {
    const result = await requestJson<StaffScheduleEntryDto>(
      `/api/staff/schedule/entries/${encodeURIComponent(entry.id)}/note`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: entry.version, note }),
      },
    );
    if (result.ok) await reload();
    return result;
  }, [reload]);

  return {
    entries: data.entries,
    staff: data.staff,
    ready,
    failure,
    reload,
    createBooking,
    createNote,
    updateNote,
  };
}
