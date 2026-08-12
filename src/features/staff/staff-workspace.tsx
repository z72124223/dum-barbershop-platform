"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import type { StaffScheduleEntryDto } from "@/domain";
import {
  MVP_TIME_OPTIONS,
  formatMvpDate,
  nextMvpScheduleSlot,
  taipeiToday,
} from "@/features/schedule/mvp-schedule-config";
import { useServerSchedule } from "@/features/schedule/use-server-schedule";
import { useTaipeiClock } from "@/features/schedule/use-taipei-clock";
import { ScheduleEntryCard } from "@/features/staff/schedule-entry-card";
import { ScheduleHistoryPanel } from "@/features/staff/schedule-history-panel";

type WorkspaceTab = "agenda" | "history" | "add";
type EntryKind = "booking" | "note";
type StaffFilter = "all" | string;

function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `staff-write-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function failureMessage(reason: string): string {
  if (reason === "slot_unavailable") return "同一位職員在這個時段已有預約，或該時段已過。註記不會占用時段。";
  if (reason === "version_conflict") return "這筆註記已被其他員工更新，請重新載入後再編輯。";
  if (reason === "idempotency_conflict") return "表單內容已變更，請重新開啟新增頁再送出。";
  if (reason === "unauthenticated" || reason === "forbidden") return "Session 或員工綁定已失效，請重新登入。";
  return "目前無法保存共用資料，請稍後安全重試。";
}

export function StaffWorkspace() {
  const { entries, staff, ready, failure, createBooking, createNote, updateNote } = useServerSchedule();
  const now = useTaipeiClock();
  const currentTaipeiDate = taipeiToday(now);
  const [initialSlot] = useState(() => nextMvpScheduleSlot());
  const [tab, setTab] = useState<WorkspaceTab>("agenda");
  const [selectedDate, setSelectedDate] = useState(currentTaipeiDate);
  const [staffFilter, setStaffFilter] = useState<StaffFilter>("all");
  const [kind, setKind] = useState<EntryKind>("booking");
  const [formDate, setFormDate] = useState(initialSlot.date);
  const [startTime, setStartTime] = useState<string>(initialSlot.time);
  const [staffId, setStaffId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const writeIdentity = useRef<{ payload: string; key: string } | null>(null);

  const selectedStaffId = staff.some((member) => member.id === staffId)
    ? staffId
    : staff[0]?.id ?? "";
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
    writeIdentity.current = null;
  }

  function idempotencyFor(payload: object): string {
    const canonical = JSON.stringify(payload);
    if (writeIdentity.current?.payload !== canonical) {
      writeIdentity.current = { payload: canonical, key: newIdempotencyKey() };
    }
    return writeIdentity.current.key;
  }

  async function saveEntryNote(
    entry: StaffScheduleEntryDto,
    nextNote: string,
  ): Promise<string | null> {
    setMessage("");
    setError("");
    const result = await updateNote(entry, nextNote);
    if (!result.ok) return failureMessage(result.reason);
    setMessage("註記已更新並保存在共用時段。");
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!selectedStaffId || formDate < currentTaipeiDate) {
      setError("不可為舊日期新增預約或註記。");
      return;
    }
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

    setBusy(true);
    let result;
    if (kind === "booking") {
      const payload = {
        staffMemberId: selectedStaffId,
        slotDate: formDate,
        slotTime: startTime,
        customerName: customerName.trim(),
        customerPhone: phone.trim(),
        note: note.trim(),
      };
      result = await createBooking({
        idempotencyKey: idempotencyFor(payload),
        ...payload,
      });
    } else {
      const payload = {
        staffMemberId: selectedStaffId,
        slotDate: formDate,
        slotTime: startTime,
        title: title.trim(),
        note: note.trim(),
      };
      result = await createNote({
        idempotencyKey: idempotencyFor(payload),
        ...payload,
      });
    }
    setBusy(false);
    if (!result.ok) {
      setError(failureMessage(result.reason));
      return;
    }

    resetForm();
    setSelectedDate(formDate);
    setStaffFilter("all");
    setTab("agenda");
    setMessage(kind === "booking" ? "預約已加入共用時段。" : "文字註記已加入共用時段。");
  }

  return (
    <section className="staff-workspace">
      <div className="local-notice" role="note">
        <strong>台灣台北時間 · 共用工作台</strong>
        <span>預約與註記由伺服器保存；每次讀寫都重新核對正式 Session 與 active Staff 綁定。</span>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="員工工作台分頁">
        <button type="button" role="tab" aria-selected={tab === "agenda"} onClick={() => selectTab("agenda")}>時段與註記</button>
        <button type="button" role="tab" aria-selected={tab === "history"} onClick={() => selectTab("history")}>歷史查詢</button>
        <button type="button" role="tab" aria-selected={tab === "add"} onClick={() => selectTab("add")}>新增</button>
      </div>

      {message ? <p className="success-message" role="status">{message}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {failure ? <p className="form-error" role="alert">{failureMessage(failure)}</p> : null}

      {tab === "agenda" ? (
        <div className="agenda-layout">
          <aside className="agenda-controls">
            <div><p className="eyebrow">AGENDA</p><h2>時段清單</h2></div>
            <label><span>日期</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
            <label>
              <span>職員</span>
              <select value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)}>
                <option value="all">全部</option>
                {staff.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
              </select>
            </label>
            <button className="button" type="button" onClick={() => selectTab("add")}>新增預約或註記</button>
          </aside>

          <div className="agenda-panel">
            <header><div><p className="eyebrow">{selectedDate || "未選日期"}</p><h2>{selectedDate ? formatMvpDate(selectedDate) : "請選擇日期"}</h2></div><span>{visibleEntries.length} 筆</span></header>
            {!ready ? <p className="inline-state" role="status">正在讀取共用時段…</p> : null}
            {ready && visibleEntries.length === 0 ? <div className="empty-state"><strong>這天還沒有資料</strong><span>新增一筆預約或文字註記即可開始。</span></div> : null}
            <div className="agenda-list">
              {visibleEntries.map((entry) => (
                <ScheduleEntryCard
                  key={entry.id}
                  entry={entry}
                  staffLabel={staff.find((member) => member.id === entry.staffId)?.label ?? "未指定職員"}
                  onSaveNote={entry.date < currentTaipeiDate ? undefined : saveEntryNote}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "history" ? <ScheduleHistoryPanel entries={entries} staff={staff} now={now} ready={ready} /> : null}

      {tab === "add" ? (
        <form className="entry-form" onSubmit={submit}>
          <header className="flow-heading"><p className="eyebrow">NEW ENTRY</p><h2>新增預約或文字註記</h2><p>兩種資料會依時間排在同一份清單。文字註記不會占用預約時段。</p></header>
          <fieldset>
            <legend>資料類型</legend>
            <div className="segmented-options">
              <button type="button" className={kind === "booking" ? "selected" : ""} aria-pressed={kind === "booking"} onClick={() => setKind("booking")}><strong>預約</strong><span>顧客與時段</span></button>
              <button type="button" className={kind === "note" ? "selected" : ""} aria-pressed={kind === "note"} onClick={() => setKind("note")}><strong>文字註記</strong><span>現場提醒</span></button>
            </div>
          </fieldset>
          <div className="form-grid">
            <label><span>日期 *</span><input type="date" min={currentTaipeiDate} value={formDate} onChange={(event) => setFormDate(event.target.value)} required /></label>
            <label><span>時間 *</span><select value={startTime} onChange={(event) => setStartTime(event.target.value)}>{MVP_TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}</select></label>
            <label><span>職員 *</span><select value={selectedStaffId} onChange={(event) => setStaffId(event.target.value)}>{staff.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</select></label>
            {kind === "booking" ? (
              <><label><span>顧客姓名 *</span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={100} required /></label><label><span>顧客電話 *</span><input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" maxLength={50} required /></label></>
            ) : (
              <label className="full"><span>註記標題 *</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required /></label>
            )}
            <label className="full"><span>{kind === "booking" ? "預約備註" : "註記內容 *"}</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={5} maxLength={2000} required={kind === "note"} /></label>
          </div>
          <div className="flow-actions"><button className="button button-secondary" type="button" disabled={busy} onClick={() => selectTab("agenda")}>返回清單</button><button className="button" type="submit" disabled={busy || !ready || !selectedStaffId}>{busy ? "正在儲存…" : "儲存到共用時段"}</button></div>
        </form>
      ) : null}
    </section>
  );
}
