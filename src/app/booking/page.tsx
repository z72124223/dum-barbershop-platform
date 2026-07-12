"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { branch, services, staff, timeSlots } from "@/data/mock-data";

const steps = ["選擇服務", "選擇設計師", "選擇日期", "選擇時間", "客戶資料", "確認"];
const dates = [
  { value: "2026-07-14", label: "07 / 14 TUE" },
  { value: "2026-07-15", label: "07 / 15 WED" },
  { value: "2026-07-16", label: "07 / 16 THU" },
  { value: "2026-07-17", label: "07 / 17 FRI" }
];

export default function BookingPage() {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(services[0].id);
  const [staffId, setStaffId] = useState(staff[0].id);
  const [date, setDate] = useState(dates[0].value);
  const [time, setTime] = useState(timeSlots[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [deposit, setDeposit] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const selectedService = useMemo(() => services.find((item) => item.id === serviceId)!, [serviceId]);
  const availableStaff = staff.filter((member) => member.serviceIds.includes(serviceId));
  const selectedStaff = availableStaff.find((item) => item.id === staffId) ?? availableStaff[0];
  const canContinue = step < 4 || (name.trim().length >= 2 && phone.trim().length >= 8);

  function chooseService(id: string) {
    setServiceId(id);
    const firstAvailable = staff.find((member) => member.serviceIds.includes(id));
    if (firstAvailable) setStaffId(firstAvailable.id);
  }

  function reset() {
    setStep(0); setConfirmed(false); setName(""); setPhone(""); setNote(""); setDeposit(false);
  }

  if (confirmed) {
    return <PageShell eyebrow="MOCK CONFIRMATION" title="NO REAL BOOKING WAS CREATED." intro="此確認畫面只代表本機前端流程完成，沒有呼叫外部服務、建立真實預約或收取款項。"><section className="content-band container"><div className="flow-panel"><p className="eyebrow">LOCAL REFERENCE / MOCK-M1-0001</p><h2>FLOW COMPLETE.</h2><div className="summary"><div><span>服務</span><strong>{selectedService.name}</strong></div><div><span>設計師</span><strong>{selectedStaff.displayName}</strong></div><div><span>時間</span><strong>{date} · {time}</strong></div><div><span>訂金</span><strong>{deposit ? "僅模擬選擇，未付款" : "未選擇"}</strong></div></div><div className="mock-alert"><strong>重要：</strong>沒有建立真實預約。請勿依此畫面前往店家。</div><div className="flow-actions"><button className="button" onClick={reset}>重新測試流程</button></div></div></section></PageShell>;
  }

  return (
    <PageShell eyebrow="BOOKING / LOCAL MOCK" title="BOOK YOUR CHAIR." intro="免登入的多人設計師 Mock 流程。所有選項只存在於此瀏覽器畫面，不會傳送到任何外部服務。">
      <section className="booking-layout container">
        <aside className="step-list" aria-label="預約步驟">{steps.map((label, index) => <div className={`step-pill ${index === step ? "active" : ""}`} key={label}>{String(index + 1).padStart(2, "0")} · {label}</div>)}</aside>
        <div className="flow-panel" aria-live="polite">
          <p className="eyebrow">STEP {String(step + 1).padStart(2, "0")} / {steps.length}</p>
          <h2>{steps[step]}</h2>

          {step === 0 && <div className="choice-grid">{services.map((item) => <button className={`choice ${serviceId === item.id ? "selected" : ""}`} key={item.id} onClick={() => chooseService(item.id)}><strong>{item.name}</strong><span>{item.durationMinutes} MIN · {item.priceLabel}</span></button>)}</div>}
          {step === 1 && <><p className="muted">此服務可由以下虛構設計師提供。「不指定」的分配規則仍待 Owner 決策，因此目前不啟用。</p><div className="choice-grid">{availableStaff.map((item) => <button className={`choice ${selectedStaff.id === item.id ? "selected" : ""}`} key={item.id} onClick={() => setStaffId(item.id)}><strong>{item.displayName}</strong><span>{item.title} · {item.specialties.join(" / ")}</span></button>)}</div></>}
          {step === 2 && <div className="choice-grid">{dates.map((item) => <button className={`choice ${date === item.value ? "selected" : ""}`} key={item.value} onClick={() => setDate(item.value)}><strong>{item.label}</strong><span>Asia/Taipei · Mock availability</span></button>)}</div>}
          {step === 3 && <div className="choice-grid">{timeSlots.map((item) => <button className={`choice ${time === item ? "selected" : ""}`} key={item} onClick={() => setTime(item)}><strong>{item}</strong><span>{selectedStaff.displayName}</span></button>)}</div>}
          {step === 4 && <div className="field-grid"><label>姓名（請輸入假資料）<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：測試客人" autoComplete="off" /></label><label>手機（請輸入假號碼）<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="例如：0900000000" inputMode="tel" autoComplete="off" /></label><label style={{ gridColumn: "1 / -1" }}>需求與備註（選填）<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="僅保留於本頁前端狀態" /></label><label style={{ gridColumn: "1 / -1", display: "flex", gridTemplateColumns: "auto 1fr", alignItems: "center" }}><input style={{ width: 20, minHeight: 20 }} type="checkbox" checked={deposit} onChange={(event) => setDeposit(event.target.checked)} /><span>模擬選擇可選訂金（不會付款，也沒有金額或退款規則）</span></label></div>}
          {step === 5 && <><div className="summary"><div><span>門市</span><strong>{branch.name}</strong></div><div><span>服務</span><strong>{selectedService.name}</strong></div><div><span>設計師</span><strong>{selectedStaff.displayName}</strong></div><div><span>日期時間</span><strong>{date} · {time}</strong></div><div><span>客戶</span><strong>{name}</strong></div><div><span>訂金</span><strong>{deposit ? "Mock optional deposit" : "Not selected"}</strong></div></div><div className="mock-alert">按下完成後只顯示本機 Mock 確認，不會建立真實預約。</div></>}

          <div className="flow-actions"><button className="button button-secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>上一步</button>{step < 5 ? <button className="button" disabled={!canContinue} onClick={() => setStep((value) => Math.min(5, value + 1))}>下一步</button> : <button className="button" onClick={() => setConfirmed(true)}>完成 Mock 預約</button>}</div>
        </div>
      </section>
    </PageShell>
  );
}
