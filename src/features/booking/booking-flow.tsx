"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PublicAvailabilityDto,
  PublicBookingResultDto,
  SafeScheduleHttpError,
} from "@/domain/schedule";
import { formatMvpDate } from "@/features/schedule/mvp-schedule-config";

const steps = ["選擇時段", "填寫資料", "確認預約"] as const;

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 3) return "••••••••";
  return `${digits.slice(0, 2)}•••••${digits.slice(-3)}`;
}

function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `booking-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function requestAvailability(): Promise<PublicAvailabilityDto> {
  const response = await fetch("/api/schedule/availability", {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("availability unavailable");
  return response.json() as Promise<PublicAvailabilityDto>;
}

export function BookingFlow({
  contact,
}: {
  contact: { href: string; label: string };
}) {
  const idempotencyKey = useRef(newIdempotencyKey());
  const [availability, setAvailability] = useState<PublicAvailabilityDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [staffId, setStaffId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<PublicBookingResultDto | null>(null);

  async function loadAvailability() {
    setLoading(true);
    try {
      const data = await requestAvailability();
      setAvailability(data);
      setDate((current) => data.dates.includes(current) ? current : data.dates[0] ?? "");
      setStaffId((current) => data.staff.some((staff) => staff.id === current)
        ? current
        : data.staff[0]?.id ?? "");
      setError("");
    } catch {
      setAvailability(null);
      setError("目前無法讀取共用時段，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void requestAvailability().then((data) => {
      if (cancelled) return;
      setAvailability(data);
      setDate(data.dates[0] ?? "");
      setStaffId(data.staff[0]?.id ?? "");
      setError("");
    }).catch(() => {
      if (cancelled) return;
      setAvailability(null);
      setError("目前無法讀取共用時段，請稍後再試。");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const staff = availability?.staff ?? [];
  const dates = availability?.dates ?? [];
  const staffLabel = staff.find((item) => item.id === staffId)?.label ?? "未指定職員";
  const timeSlots = useMemo(
    () => (availability?.slots ?? []).filter((slot) =>
      slot.staffId === staffId && slot.date === date,
    ),
    [availability, date, staffId],
  );

  function chooseStaff(nextStaffId: string) {
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

  async function confirmBooking() {
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/schedule/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          staffMemberId: staffId,
          slotDate: date,
          slotTime: startTime,
          customerName: customerName.trim(),
          customerPhone: phone.trim(),
          note: note.trim(),
        }),
      });
      const body = await response.json() as PublicBookingResultDto | SafeScheduleHttpError;
      if (!response.ok) {
        const failure = body as SafeScheduleHttpError;
        if (failure.error === "slot_unavailable") {
          setStep(0);
          setStartTime("");
          await loadAvailability();
          setError("這個時段剛被預約，請重新選擇。");
        } else if (failure.error === "idempotency_conflict") {
          setError("這筆送出資料已改變，請重新開啟預約頁再試一次。");
        } else {
          setError("目前無法完成預約；沒有任何重複預約被建立，請稍後安全重試。");
        }
        return;
      }
      setCreated(body as PublicBookingResultDto);
    } catch {
      setError("連線中斷；可使用同一頁再次送出，系統會防止重複預約。");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <section className="booking-complete" role="status">
        <span className="status-mark" aria-hidden="true">✓</span>
        <p className="eyebrow">預約已成立</p>
        <h1>共用時段已安全記下來。</h1>
        <p>員工在另一台已登入裝置重新整理後，也能看到這筆預約。</p>
        <dl className="summary-list">
          <div><dt>日期</dt><dd>{formatMvpDate(created.booking.date)}</dd></div>
          <div><dt>時間</dt><dd>{created.booking.time}</dd></div>
          <div><dt>職員</dt><dd>{staffLabel}</dd></div>
          <div><dt>狀態</dt><dd>已成立</dd></div>
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
        <strong>台灣台北時間 · 共用預約</strong>
        <span>所有時段與衝突都由站內伺服器重新驗證，瀏覽器不保存正式預約資料。</span>
      </div>

      <section className="collection-notice" aria-labelledby="collection-notice-title">
        <p className="eyebrow">CUSTOMER DATA NOTICE</p>
        <h2 id="collection-notice-title">個人資料蒐集告知</h2>
        <dl className="summary-list">
          <div><dt>蒐集者</dt><dd>DUM BARBERSHOP；權利請求聯絡管道：<a href={contact.href}>{contact.label}</a></dd></div>
          <div><dt>目的</dt><dd>建立、管理本次預約，以及就選定預約與客戶聯絡。</dd></div>
          <div><dt>欄位</dt><dd>姓名、電話、選定職員／日期／時間，以及選填註記。</dd></div>
          <div><dt>期間</dt><dd>自預約日起 12 個月；輪替備份最多再保留 28 日。</dd></div>
          <div><dt>地區／處理者</dt><dd>台灣 origin 與 Cloudflare 全球網路／處理者；連線 metadata 可能在美國或歐洲處理，App 預約紀錄只提供已驗證員工。</dd></div>
          <div><dt>使用方式</dt><dd>同站網站經 HTTPS／Cloudflare Tunnel 傳至台灣資料庫，只用於預約管理與聯絡，不作行銷。</dd></div>
          <div><dt>權利</dt><dd>可透過上述 Owner 管理管道請求查閱、複本、補充／更正、停止蒐集／處理／利用或刪除。</dd></div>
          <div><dt>不提供的影響</dt><dd>姓名與電話為建立預約所必需；註記可不提供。</dd></div>
        </dl>
      </section>

      <ol className="step-tabs" aria-label="預約步驟">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? "active" : index < step ? "done" : ""}>
            <span>{index + 1}</span><strong>{label}</strong>
          </li>
        ))}
      </ol>

      <div className="flow-panel">
        <header className="flow-heading">
          <p className="eyebrow">步驟 {step + 1} / {steps.length}</p>
          <h2 id="booking-title">{steps[step]}</h2>
        </header>

        {loading ? <p className="inline-state" role="status">正在讀取共用時段…</p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}

        {!loading && availability && step === 0 ? (
          <div className="flow-fields">
            <fieldset>
              <legend>選擇職員</legend>
              <div className="segmented-options">
                {staff.map((item) => (
                  <button key={item.id} type="button" className={staffId === item.id ? "selected" : ""} aria-pressed={staffId === item.id} onClick={() => chooseStaff(item.id)}>
                    <strong>{item.label}</strong><span>固定 60 分鐘時段</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>選擇日期</legend>
              <div className="date-options">
                {dates.map((item) => (
                  <button key={item} type="button" className={date === item ? "selected" : ""} aria-pressed={date === item} onClick={() => chooseDate(item)}>
                    <strong>{formatMvpDate(item)}</strong><span>{item}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>選擇時段</legend>
              <div className="time-options">
                {timeSlots.map((slot) => (
                  <button key={slot.time} type="button" disabled={!slot.available} className={startTime === slot.time ? "selected" : ""} aria-pressed={startTime === slot.time} onClick={() => { setStartTime(slot.time); setError(""); }}>
                    {slot.time}{!slot.available ? <small>不可預約</small> : null}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="form-grid">
            <label><span>姓名 *</span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" maxLength={100} /></label>
            <label><span>電話 *</span><input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" maxLength={50} /></label>
            <label className="full"><span>備註</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} maxLength={2000} placeholder="可留空；需要補充時再填寫。" /></label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="booking-review">
            <dl className="summary-list">
              <div><dt>日期</dt><dd>{formatMvpDate(date)}</dd></div>
              <div><dt>時間</dt><dd>{startTime}</dd></div>
              <div><dt>職員</dt><dd>{staffLabel}</dd></div>
              <div><dt>姓名</dt><dd>{customerName.trim()}</dd></div>
              <div><dt>電話</dt><dd>{maskPhone(phone)}</dd></div>
              <div><dt>備註</dt><dd>{note.trim() || "無"}</dd></div>
            </dl>
          </div>
        ) : null}

        <div className="flow-actions">
          {step > 0 ? <button className="button button-secondary" type="button" disabled={busy} onClick={() => { setError(""); setStep((current) => current - 1); }}>上一步</button> : <span />}
          {step < steps.length - 1 ? (
            <button className="button" type="button" disabled={loading || !availability} onClick={goNext}>下一步</button>
          ) : (
            <button className="button" type="button" disabled={busy} onClick={confirmBooking}>{busy ? "正在建立…" : "確認預約"}</button>
          )}
        </div>
      </div>
    </section>
  );
}
