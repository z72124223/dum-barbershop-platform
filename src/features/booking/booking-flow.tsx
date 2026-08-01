"use client";

import { useMemo, useState } from "react";
import type { MvpBookingScheduleEntry } from "@/domain";
import {
  MVP_STAFF_OPTIONS,
  MVP_TIME_OPTIONS,
  formatMvpDate,
  staffLabel,
  upcomingTaipeiDates,
} from "@/features/schedule/mvp-schedule-config";
import { useMvpSchedule } from "@/features/schedule/use-mvp-schedule";

const steps = ["選擇時段", "填寫資料", "確認預約"] as const;

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 3) return "••••••••";
  return `${digits.slice(0, 2)}•••••${digits.slice(-3)}`;
}

function createEntryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `mvp-booking-${crypto.randomUUID()}`;
  }
  return `mvp-booking-${Date.now()}`;
}

export function BookingFlow() {
  const dates = useMemo(() => upcomingTaipeiDates(), []);
  const { entries, ready, failure, addEntry } = useMvpSchedule();
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(dates[0] ?? "");
  const [startTime, setStartTime] = useState("");
  const [staffId, setStaffId] = useState<string>(MVP_STAFF_OPTIONS[0].id);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<MvpBookingScheduleEntry | null>(null);

  const occupiedTimes = useMemo(
    () => new Set(entries
      .filter((entry) => entry.kind === "booking" && entry.date === date && entry.staffId === staffId)
      .map((entry) => entry.startTime)),
    [date, entries, staffId],
  );

  function chooseStaff(nextStaffId: typeof staffId) {
    setStaffId(nextStaffId);
    setStartTime("");
    setError("");
  }

  function chooseDate(nextDate: string) {
    setDate(nextDate);
    setStartTime("");
    setError("");
  }

  function goNext() {
    setError("");
    if (step === 0 && (!date || !startTime || !staffId)) {
      setError("請先選擇日期、時間與職員。");
      return;
    }
    if (
      step === 1
      && (customerName.trim().length < 1 || phone.replace(/\D/g, "").length < 8)
    ) {
      setError("請填寫姓名與可辨識的電話格式。");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function confirmBooking() {
    setError("");
    if (!acknowledged) {
      setError("請先確認這筆資料只會儲存在目前瀏覽器。");
      return;
    }

    const candidate: MvpBookingScheduleEntry = {
      id: createEntryId(),
      kind: "booking",
      date,
      startTime,
      staffId,
      customerName: customerName.trim(),
      phone: maskPhone(phone),
      note: note.trim(),
      source: "customer",
      createdAt: new Date().toISOString(),
    };
    const result = addEntry(candidate);
    if (!result.ok) {
      setError(result.reason === "booking_conflict"
        ? "這個時段剛被占用，請返回重新選擇。"
        : "目前無法保存資料，請確認瀏覽器允許本機儲存後再試一次。");
      return;
    }
    if (result.entry.kind === "booking") setCreated(result.entry);
  }

  if (created) {
    return (
      <section className="booking-complete" role="status">
        <span className="status-mark" aria-hidden="true">✓</span>
        <p className="eyebrow">預約已加入本機時段</p>
        <h1>這台瀏覽器已記下來。</h1>
        <p>員工登入同一台裝置後，就能在工作台看到這筆預約。資料不會傳送到其他裝置。</p>
        <dl className="summary-list">
          <div><dt>日期</dt><dd>{formatMvpDate(created.date)}</dd></div>
          <div><dt>時間</dt><dd>{created.startTime}</dd></div>
          <div><dt>職員</dt><dd>{staffLabel(created.staffId)}</dd></div>
          <div><dt>姓名</dt><dd>{created.customerName}</dd></div>
          <div><dt>備註</dt><dd>{created.note || "無"}</dd></div>
        </dl>
        <button className="button" type="button" onClick={() => window.location.assign("/booking")}>
          再新增一筆
        </button>
      </section>
    );
  }

  return (
    <section className="booking-shell" aria-labelledby="booking-title">
      <div className="local-notice" role="note">
        <strong>第一版靜態預約</strong>
        <span>資料只保存在目前瀏覽器，不會自動送到店家或其他裝置。</span>
      </div>

      <ol className="step-tabs" aria-label="預約步驟">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? "active" : index < step ? "done" : ""}>
            <span>{index + 1}</span>
            <strong>{label}</strong>
          </li>
        ))}
      </ol>

      <div className="flow-panel">
        <header className="flow-heading">
          <p className="eyebrow">步驟 {step + 1} / {steps.length}</p>
          <h2 id="booking-title">{steps[step]}</h2>
        </header>

        {!ready ? <p className="inline-state" role="status">正在讀取本機時段…</p> : null}
        {failure ? (
          <p className="form-error" role="alert">
            本機資料無法讀取。請確認瀏覽器允許網站儲存資料。
          </p>
        ) : null}

        {ready && !failure && step === 0 ? (
          <div className="flow-fields">
            <fieldset>
              <legend>選擇職員</legend>
              <div className="segmented-options">
                {MVP_STAFF_OPTIONS.map((staff) => (
                  <button
                    key={staff.id}
                    type="button"
                    className={staffId === staff.id ? "selected" : ""}
                    aria-pressed={staffId === staff.id}
                    onClick={() => chooseStaff(staff.id)}
                  >
                    <strong>{staff.shortLabel}</strong>
                    <span>虛構示範身分</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>選擇日期</legend>
              <div className="date-options">
                {dates.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={date === item ? "selected" : ""}
                    aria-pressed={date === item}
                    onClick={() => chooseDate(item)}
                  >
                    <strong>{formatMvpDate(item)}</strong>
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>選擇示範時段</legend>
              <div className="time-options">
                {MVP_TIME_OPTIONS.map((time) => {
                  const occupied = occupiedTimes.has(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={occupied}
                      className={startTime === time ? "selected" : ""}
                      aria-pressed={startTime === time}
                      onClick={() => {
                        setStartTime(time);
                        setError("");
                      }}
                    >
                      {time}
                      {occupied ? <small>已有預約</small> : null}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="form-grid">
            <label>
              <span>姓名 *</span>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                autoComplete="name"
              />
            </label>
            <label>
              <span>電話 *</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <label className="full">
              <span>備註</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder="可留空；需要補充時再填寫。"
              />
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="booking-review">
            <dl className="summary-list">
              <div><dt>日期</dt><dd>{formatMvpDate(date)}</dd></div>
              <div><dt>時間</dt><dd>{startTime}</dd></div>
              <div><dt>職員</dt><dd>{staffLabel(staffId)}</dd></div>
              <div><dt>姓名</dt><dd>{customerName.trim()}</dd></div>
              <div><dt>電話</dt><dd>{maskPhone(phone)}</dd></div>
              <div><dt>備註</dt><dd>{note.trim() || "無"}</dd></div>
            </dl>
            <label className="check-row">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              <span>我了解這是靜態 MVP，資料只保存在目前瀏覽器。</span>
            </label>
          </div>
        ) : null}

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <div className="flow-actions">
          {step > 0 ? (
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                setError("");
                setStep((current) => current - 1);
              }}
            >
              上一步
            </button>
          ) : <span />}
          {step < steps.length - 1 ? (
            <button className="button" type="button" disabled={!ready || Boolean(failure)} onClick={goNext}>
              下一步
            </button>
          ) : (
            <button className="button" type="button" onClick={confirmBooking}>
              確認預約
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
