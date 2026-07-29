"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type {
  MvpBookingScheduleEntry,
  MvpNoteScheduleEntry,
  MvpScheduleEntry,
} from "@/domain";
import {
  MVP_STAFF_OPTIONS,
  MVP_TIME_OPTIONS,
  formatMvpDate,
  nextMvpScheduleSlot,
  taipeiToday,
} from "@/features/schedule/mvp-schedule-config";
import { useMvpSchedule } from "@/features/schedule/use-mvp-schedule";
import { useTaipeiClock } from "@/features/schedule/use-taipei-clock";
import { ScheduleEntryCard } from "@/features/staff/schedule-entry-card";
import { ScheduleHistoryPanel } from "@/features/staff/schedule-history-panel";

type WorkspaceTab = "agenda" | "history" | "add";
type EntryKind = MvpScheduleEntry["kind"];
type StaffFilter = "all" | string;

function createEntryId(kind: EntryKind): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `mvp-${kind}-${crypto.randomUUID()}`;
  }
  return `mvp-${kind}-${Date.now()}`;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 3) return "••••••••";
  return `${digits.slice(0, 2)}•••••${digits.slice(-3)}`;
}

export function StaffWorkspace() {
  const {
    entries,
    ready,
    failure,
    addEntry,
    updateEntry,
  } = useMvpSchedule();
  const now = useTaipeiClock();
  const currentTaipeiDate = taipeiToday(now);
  const [initialSlot] = useState(() => nextMvpScheduleSlot());
  const [tab, setTab] = useState<WorkspaceTab>("agenda");
  const [selectedDate, setSelectedDate] = useState(currentTaipeiDate);
  const [staffFilter, setStaffFilter] = useState<StaffFilter>("all");
  const [kind, setKind] = useState<EntryKind>("booking");
  const [formDate, setFormDate] = useState(initialSlot.date);
  const [startTime, setStartTime] = useState<string>(initialSlot.time);
  const [staffId, setStaffId] = useState<string>(MVP_STAFF_OPTIONS[0].id);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const visibleEntries = useMemo(
    () => entries.filter((entry) =>
      entry.date === selectedDate
      && (staffFilter === "all" || entry.staffId === staffFilter),
    ),
    [entries, selectedDate, staffFilter],
  );

  function selectTab(nextTab: WorkspaceTab) {
    setTab(nextTab);
    setMessage("");
    setError("");
  }

  function resetForm() {
    setCustomerName("");
    setPhone("");
    setTitle("");
    setNote("");
  }

  function saveEntryNote(
    entry: MvpScheduleEntry,
    nextNote: string,
  ): string | null {
    setMessage("");
    setError("");

    const result = updateEntry({
      ...entry,
      note: nextNote,
    });
    if (!result.ok) {
      return result.reason === "invalid_entry"
        ? "註記內容格式無效，請檢查後再試。"
        : "註記無法保存，請確認瀏覽器允許本機儲存。";
    }

    setMessage("註記已更新。");
    return null;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const now = new Date().toISOString();

    const entry: MvpBookingScheduleEntry | MvpNoteScheduleEntry = kind === "booking"
      ? {
          id: createEntryId("booking"),
          kind: "booking",
          date: formDate,
          startTime,
          staffId,
          customerName: customerName.trim(),
          phone: maskPhone(phone),
          note: note.trim(),
          source: "staff",
          createdAt: now,
        }
      : {
          id: createEntryId("note"),
          kind: "note",
          date: formDate,
          startTime,
          staffId,
          title: title.trim(),
          note: note.trim(),
          source: "staff",
          createdAt: now,
        };

    if (
      kind === "booking"
      && (customerName.trim().length < 1 || phone.replace(/\D/g, "").length < 8)
    ) {
      setError("新增預約時，請填寫姓名與可辨識的電話格式。");
      return;
    }
    if (kind === "note" && (!title.trim() || !note.trim())) {
      setError("新增註記時，請填寫標題與文字內容。");
      return;
    }

    const result = addEntry(entry);
    if (!result.ok) {
      setError(result.reason === "booking_conflict"
        ? "同一位職員在這個時段已有預約。註記不會占用時段。"
        : "資料無法保存，請確認瀏覽器允許本機儲存。");
      return;
    }

    resetForm();
    setSelectedDate(formDate);
    setStaffFilter("all");
    setTab("agenda");
    setMessage(kind === "booking" ? "預約已加入時段。" : "文字註記已加入時段。");
  }

  return (
    <section className="staff-workspace">
      <div className="local-notice" role="note">
        <strong>台灣台北時間 · 本機工作台</strong>
        <span>時段自動依 Asia/Taipei 對齊；預約與註記仍只在目前瀏覽器有效。</span>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="員工工作台分頁">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "agenda"}
          onClick={() => selectTab("agenda")}
        >
          時段與註記
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          onClick={() => selectTab("history")}
        >
          歷史查詢
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "add"}
          onClick={() => selectTab("add")}
        >
          新增
        </button>
      </div>

      {message ? <p className="success-message" role="status">{message}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {failure ? (
        <p className="form-error" role="alert">
          本機資料無法讀取。請確認瀏覽器允許網站儲存資料。
        </p>
      ) : null}

      {tab === "agenda" ? (
        <div className="agenda-layout">
          <aside className="agenda-controls">
            <div>
              <p className="eyebrow">AGENDA</p>
              <h2>時段清單</h2>
            </div>
            <label>
              <span>日期</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <label>
              <span>職員</span>
              <select
                value={staffFilter}
                onChange={(event) => setStaffFilter(event.target.value)}
              >
                <option value="all">全部</option>
                {MVP_STAFF_OPTIONS.map((staff) => (
                  <option key={staff.id} value={staff.id}>{staff.shortLabel}</option>
                ))}
              </select>
            </label>
            <button className="button" type="button" onClick={() => selectTab("add")}>
              新增預約或註記
            </button>
          </aside>

          <div className="agenda-panel">
            <header>
              <div>
                <p className="eyebrow">{selectedDate || "未選日期"}</p>
                <h2>{selectedDate ? formatMvpDate(selectedDate) : "請選擇日期"}</h2>
              </div>
              <span>{visibleEntries.length} 筆</span>
            </header>

            {!ready ? <p className="inline-state" role="status">正在讀取本機時段…</p> : null}
            {ready && visibleEntries.length === 0 ? (
              <div className="empty-state">
                <strong>這天還沒有資料</strong>
                <span>新增一筆預約或文字註記即可開始。</span>
              </div>
            ) : null}
            <div className="agenda-list">
              {visibleEntries.map((entry) => (
                <ScheduleEntryCard
                  key={entry.id}
                  entry={entry}
                  onSaveNote={saveEntryNote}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "history" ? (
        <ScheduleHistoryPanel entries={entries} now={now} ready={ready} />
      ) : null}

      {tab === "add" ? (
        <form className="entry-form" onSubmit={submit}>
          <header className="flow-heading">
            <p className="eyebrow">NEW ENTRY</p>
            <h2>新增預約或文字註記</h2>
            <p>兩種資料會依時間排在同一份清單。文字註記不會占用預約時段。</p>
          </header>

          <fieldset>
            <legend>資料類型</legend>
            <div className="segmented-options">
              <button
                type="button"
                className={kind === "booking" ? "selected" : ""}
                aria-pressed={kind === "booking"}
                onClick={() => setKind("booking")}
              >
                <strong>預約</strong>
                <span>顧客與時段</span>
              </button>
              <button
                type="button"
                className={kind === "note" ? "selected" : ""}
                aria-pressed={kind === "note"}
                onClick={() => setKind("note")}
              >
                <strong>文字註記</strong>
                <span>現場提醒</span>
              </button>
            </div>
          </fieldset>

          <div className="form-grid">
            <label>
              <span>日期 *</span>
              <input
                type="date"
                value={formDate}
                onChange={(event) => setFormDate(event.target.value)}
                required
              />
            </label>
            <label>
              <span>時間 *</span>
              <select value={startTime} onChange={(event) => setStartTime(event.target.value)}>
                {MVP_TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </label>
            <label>
              <span>職員 *</span>
              <select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
                {MVP_STAFF_OPTIONS.map((staff) => (
                  <option key={staff.id} value={staff.id}>{staff.shortLabel}</option>
                ))}
              </select>
            </label>

            {kind === "booking" ? (
              <>
                <label>
                  <span>顧客姓名 *</span>
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>顧客電話 *</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    inputMode="tel"
                    required
                  />
                </label>
              </>
            ) : (
              <label className="full">
                <span>註記標題 *</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </label>
            )}

            <label className="full">
              <span>{kind === "booking" ? "預約備註" : "註記內容 *"}</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={5}
                required={kind === "note"}
              />
            </label>
          </div>

          <div className="flow-actions">
            <button className="button button-secondary" type="button" onClick={() => selectTab("agenda")}>
              返回清單
            </button>
            <button className="button" type="submit">儲存到本機時段</button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
