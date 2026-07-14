"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createMockPlatform } from "../../adapters";
import { mockBookings, mockBranch, mockCalendarBlocks, mockServices, mockStaff } from "../../data/mock";
import { DomainError, type Booking, type Customer, type IsoDate } from "../../domain";
import { ANY_STAFF, calculateBookingOptions, type BookingSlotOption, type StaffChoice } from "./booking-logic";

const steps = ["服務", "設計師", "日期", "時間", "資料", "確認"] as const;
const demoDates: IsoDate[] = ["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18", "2026-07-19"];

const emptyMessages = {
  staff_not_scheduled: "這天沒有安排值班，請換一天看看。",
  fully_booked: "這天的示範時段已滿，請換一天或改選不指定設計師。",
  service_not_supported: "這位設計師目前沒有提供所選的示範服務。",
} as const;

function dateLabel(date: IsoDate) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T12:00:00+08:00`));
}

function selectedFromQuery(value: string | null, validIds: string[]) {
  return value && validIds.includes(value) ? value : "";
}

function maskDemoPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 3 ? `09•••••${digits.slice(-3)}` : "09••••••••";
}

export function BookingFlow() {
  const searchParams = useSearchParams();
  const [platform] = useState(createMockPlatform);
  const queriedService = selectedFromQuery(searchParams.get("service"), mockServices.map((service) => service.id));
  const queriedStaff = selectedFromQuery(searchParams.get("staff"), mockStaff.map((staff) => staff.id));
  const compatibleQueriedStaff = queriedStaff && (!queriedService || mockStaff.find((staff) => staff.id === queriedStaff)?.serviceIds.includes(queriedService)) ? queriedStaff : "";

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(queriedService);
  const [staffChoice, setStaffChoice] = useState<StaffChoice | "">(compatibleQueriedStaff);
  const [date, setDate] = useState<IsoDate | "">("");
  const [slot, setSlot] = useState<BookingSlotOption | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [depositChoice, setDepositChoice] = useState<"none" | "interested">("none");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");

  const selectedService = mockServices.find((service) => service.id === serviceId);
  const selectedStaff = slot
    ? mockStaff.find((staff) => staff.id === slot.staffId)
    : mockStaff.find((staff) => staff.id === staffChoice);

  const availability = useMemo(() => {
    if (!serviceId || !staffChoice || !date) return null;
    return calculateBookingOptions({
      branchId: mockBranch.id,
      serviceId,
      staffChoice,
      date,
    }, {
      branches: [mockBranch],
      staff: mockStaff,
      services: mockServices,
      bookings: mockBookings,
      blocks: mockCalendarBlocks,
    });
  }, [date, serviceId, staffChoice]);

  const canContinue = [
    Boolean(serviceId),
    Boolean(staffChoice),
    Boolean(date),
    Boolean(slot),
    name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 8,
    acknowledged,
  ][step];

  function next() {
    setError("");
    if (!canContinue) {
      setError(step === 4 ? "請填寫姓名與可辨識的示範電話格式。請勿使用真實個資。" : "請先完成這個步驟。" );
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function chooseService(nextServiceId: string) {
    setServiceId(nextServiceId);
    setStaffChoice("");
    setDate("");
    setSlot(null);
  }

  function chooseStaff(nextStaff: StaffChoice) {
    setStaffChoice(nextStaff);
    setDate("");
    setSlot(null);
  }

  async function confirmBooking() {
    if (!slot || !selectedService || !selectedStaff || !acknowledged) return;
    setSubmitting(true);
    setError("");
    const suffix = `${Date.now()}`;
    const now = new Date().toISOString();
    const customer: Customer = {
      id: `customer-local-${suffix}`,
      name: name.trim(),
      phoneMasked: maskDemoPhone(phone),
      createdAt: now,
      notes: notes.trim() ? [notes.trim()] : [],
      history: [],
    };
    const booking: Booking = {
      id: `booking-local-${suffix}`,
      branchId: mockBranch.id,
      serviceId: selectedService.id,
      staffId: selectedStaff.id,
      customerId: customer.id,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      status: "pending",
      depositStatus: depositChoice === "interested" ? "unpaid" : "not_required",
      ...(notes.trim() ? { note: notes.trim() } : {}),
      createdAt: now,
      updatedAt: now,
      source: "mock_customer",
      managementCodeMasked: `DUM-MOCK-${suffix.slice(-6)}`,
    };

    try {
      await platform.customers.save(customer);
      const created = await platform.bookings.create({ booking, idempotencyKey: booking.id });
      await platform.notifications.sendBookingConfirmation(created, customer);
      setConfirmationCode(created.managementCodeMasked ?? created.id.replace("booking-local-", "DUM-MOCK-"));
      window.sessionStorage.setItem(
        "dum-booking-preview",
        JSON.stringify({ booking: created, customer: { ...customer, name: "Local Preview Customer" } }),
      );
    } catch (caught) {
      setError(caught instanceof DomainError && caught.code === "BOOKING_CONFLICT"
        ? "這個時段剛好被占用了，請返回重新選擇。"
        : "Mock 預約暫時無法完成，請再試一次。");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationCode) {
    return (
      <section className="booking-confirmation" role="status">
        <p className="eyebrow">MOCK CONFIRMATION</p>
        <h2>流程完成，但沒有建立真實預約。</h2>
        <p>這是本機示範結果，不會傳送給店家、不會寄出通知，也不會收取費用。</p>
        <dl className="summary-list">
          <div><dt>示範編號</dt><dd>{confirmationCode}</dd></div>
          <div><dt>服務</dt><dd>{selectedService?.name}</dd></div>
          <div><dt>設計師</dt><dd>{selectedStaff?.displayName}</dd></div>
          <div><dt>時間</dt><dd>{date ? dateLabel(date) : ""} {slot?.label}</dd></div>
        </dl>
        <button className="button" type="button" onClick={() => window.location.assign("/booking")}>重新體驗</button>
        <Link className="button button-secondary" href="/booking/manage">查詢這筆示範預約</Link>
      </section>
    );
  }

  return (
    <section className="booking-shell" aria-labelledby="booking-flow-title">
      <div className="booking-notice" role="note">
        <strong>本機 Mock 體驗</strong>
        <span>請勿輸入真實姓名或電話；重新整理後資料就會消失。</span>
      </div>
      <div className="booking-entry-nav"><span>建立新的 Mock 預約</span><Link href="/booking/manage">已有示範編號？查詢／改期／取消</Link></div>
      <ol className="booking-progress" aria-label="預約進度">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? "active" : index < step ? "done" : ""} aria-current={index === step ? "step" : undefined}>
            <span>{index + 1}</span>{label}
          </li>
        ))}
      </ol>

      <div className="booking-panel">
        <div className="booking-panel-heading">
          <p className="eyebrow">STEP {step + 1} / {steps.length}</p>
          <h2 id="booking-flow-title">{
            ["選擇示範服務", "選擇設計師", "選擇示範日期", "選擇可預約時段", "填寫聯絡資料", "確認內容"][step]
          }</h2>
        </div>

        {step === 0 ? (
          <div className="choice-grid">
            {mockServices.map((service) => (
              <button key={service.id} type="button" className={`choice-card ${serviceId === service.id ? "selected" : ""}`} aria-pressed={serviceId === service.id} onClick={() => chooseService(service.id)}>
                <span className="choice-kicker">{service.category.toUpperCase()}</span>
                <strong>{service.name}</strong>
                <small>{service.durationMinutes} 分鐘 · 價格待 Owner 決策</small>
                <span>{service.description}</span>
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="choice-grid">
            <button type="button" className={`choice-card ${staffChoice === ANY_STAFF ? "selected" : ""}`} aria-pressed={staffChoice === ANY_STAFF} onClick={() => chooseStaff(ANY_STAFF)}>
              <span className="choice-kicker">EARLIEST AVAILABLE</span>
              <strong>不指定設計師</strong>
              <small>系統會安排最早可用的一位</small>
              <span>最後仍會指派一位實際設計師，不會建立沒有負責人的預約。</span>
            </button>
            {mockStaff.filter((staff) => staff.serviceIds.includes(serviceId)).map((staff) => (
              <button key={staff.id} type="button" className={`choice-card ${staffChoice === staff.id ? "selected" : ""}`} aria-pressed={staffChoice === staff.id} onClick={() => chooseStaff(staff.id)}>
                <span className="choice-kicker">FICTIONAL STAFF</span>
                <strong>{staff.displayName}</strong>
                <small>{staff.title}</small>
                <span>{staff.specialties.join(" · ")}</span>
              </button>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="date-grid">
            {demoDates.map((item) => (
              <button key={item} type="button" className={`date-card ${date === item ? "selected" : ""}`} aria-pressed={date === item} onClick={() => { setDate(item); setSlot(null); }}>
                <strong>{dateLabel(item)}</strong><span>{item}</span>
              </button>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          availability && availability.slots.length > 0 ? (
            <div className="time-grid">
              {availability.slots.slice(0, 18).map((item) => {
                const staff = mockStaff.find((member) => member.id === item.staffId);
                return (
                  <button key={`${item.startsAt}-${item.staffId}`} type="button" className={`time-card ${slot?.startsAt === item.startsAt && slot.staffId === item.staffId ? "selected" : ""}`} aria-pressed={slot?.startsAt === item.startsAt && slot.staffId === item.staffId} onClick={() => setSlot(item)}>
                    <strong>{item.label}</strong><span>{staff?.displayName}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="inline-state" role="status"><strong>目前沒有可選時段</strong><span>{availability?.emptyReason ? emptyMessages[availability.emptyReason] : "請返回選擇日期。"}</span></div>
          )
        ) : null}

        {step === 4 ? (
          <div className="form-grid">
            <label><span>示範姓名 *</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：測試客人" autoComplete="off" /></label>
            <label><span>示範電話 *</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="例如：0900-000-000" inputMode="tel" autoComplete="off" /></label>
            <label className="full"><span>需求與備註</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="只填虛構內容；請勿輸入真實健康或個人資料。" /></label>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="booking-review">
            <dl className="summary-list">
              <div><dt>服務</dt><dd>{selectedService?.name}</dd></div>
              <div><dt>設計師</dt><dd>{selectedStaff?.displayName}</dd></div>
              <div><dt>日期與時間</dt><dd>{date ? dateLabel(date) : ""} {slot?.label}</dd></div>
              <div><dt>聯絡資料</dt><dd>{name} · {phone}</dd></div>
              <div><dt>備註</dt><dd>{notes || "無"}</dd></div>
            </dl>
            <fieldset className="deposit-fieldset">
              <legend>可選訂金（僅保留介面，不會付款）</legend>
              <label><input type="radio" name="deposit" checked={depositChoice === "none"} onChange={() => setDepositChoice("none")} /> 本次不使用訂金</label>
              <label><input type="radio" name="deposit" checked={depositChoice === "interested"} onChange={() => setDepositChoice("interested")} /> 有興趣使用訂金（不設定金額、不收款）</label>
            </fieldset>
            <label className="acknowledgement"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /> 我了解這只是 Mock 示範，不會建立真實預約。</label>
          </div>
        ) : null}

        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="booking-actions">
          {step > 0 ? <button className="button button-secondary" type="button" onClick={() => { setError(""); setStep((current) => current - 1); }}>上一步</button> : <span />}
          {step < steps.length - 1
            ? <button className="button" type="button" onClick={next}>下一步</button>
            : <button className="button" type="button" disabled={!acknowledged || submitting} onClick={confirmBooking}>{submitting ? "正在建立 Mock…" : "完成 Mock 預約"}</button>}
        </div>
      </div>
    </section>
  );
}
