"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { mockBookings, mockCustomers, mockServices, mockStaff } from "../../data/mock";
import {
  DomainError,
  rankSafeWaitlist,
  requestCustomerCancellation,
  rescheduleBooking,
  type Booking,
  type Customer,
} from "../../domain";

const labels: Record<Booking["status"], string> = {
  pending: "等待確認",
  confirmed: "已確認",
  checked_in: "已報到",
  in_service: "服務中",
  completed: "已完成",
  cancelled_by_customer: "客人已取消",
  cancelled_by_shop: "店家已取消",
  no_show: "未到店",
  rescheduled: "已改期",
  waitlisted: "候補中",
};

interface StoredPreview {
  booking: Booking;
  customer: Customer;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function plusOneDay(value: string) {
  return new Date(new Date(value).getTime() + 24 * 60 * 60 * 1000).toISOString();
}

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [auditCount, setAuditCount] = useState(0);

  function readStoredPreview(): StoredPreview | null {
    const raw = window.sessionStorage.getItem("dum-booking-preview");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredPreview;
    } catch {
      window.sessionStorage.removeItem("dum-booking-preview");
      return null;
    }
  }

  const selected = bookings.find((booking) => booking.id === selectedId) ?? null;
  const customer = selected ? customers.find((item) => item.id === selected.customerId) : null;
  const rankedWaitlist = useMemo(() => rankSafeWaitlist(bookings), [bookings]);

  function lookup() {
    setError("");
    setMessage("");
    const normalized = query.trim().toLocaleLowerCase("en");
    const stored = readStoredPreview();
    const availableBookings = stored && !bookings.some((item) => item.id === stored.booking.id)
      ? [...bookings, stored.booking]
      : bookings;
    const availableCustomers = stored && !customers.some((item) => item.id === stored.customer.id)
      ? [...customers, stored.customer]
      : customers;
    const customerIds = availableCustomers
      .filter((item) => `${item.name} ${item.phoneMasked}`.toLocaleLowerCase("en").includes(normalized))
      .map((item) => item.id);
    const found = availableBookings.find((booking) =>
      booking.managementCodeMasked?.toLocaleLowerCase("en") === normalized ||
      booking.id.toLocaleLowerCase("en") === normalized ||
      customerIds.includes(booking.customerId),
    );
    if (!normalized || !found) {
      setSelectedId("");
      setError("找不到這筆本機示範預約。可使用下方提供的測試編號。");
      return;
    }
    setBookings(availableBookings);
    setCustomers(availableCustomers);
    setSelectedId(found.id);
  }

  function updateRecord(record: Booking) {
    setBookings((current) => current.map((item) => item.id === record.id ? record : item));
  }

  function cancel() {
    if (!selected) return;
    try {
      const result = requestCustomerCancellation(selected, selected.customerId, new Date().toISOString());
      updateRecord(result.booking);
      setAuditCount((count) => count + 1);
      setMessage("已完成本機取消請求。正式取消期限、退款與費用仍待店家決定，這裡沒有套用任何真實政策。");
      setError("");
    } catch (caught) {
      setError(caught instanceof DomainError ? "這個狀態不能由客人自行取消。" : "示範取消暫時無法完成。");
    }
  }

  function reschedule() {
    if (!selected) return;
    const suffix = `${selected.id.replace(/[^a-z0-9]/gi, "-")}-${bookings.length}`;
    const replacement: Booking = {
      ...selected,
      id: `booking-rescheduled-${suffix}`,
      startsAt: plusOneDay(selected.startsAt),
      endsAt: plusOneDay(selected.endsAt),
      status: "pending",
      managementCodeMasked: `DUM-MOCK-R${suffix.slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "mock_customer",
      rescheduledFromBookingId: undefined,
      rescheduledToBookingId: undefined,
    };
    try {
      const result = rescheduleBooking(selected, replacement, selected.customerId, new Date().toISOString());
      setBookings((current) => [
        ...current.map((item) => item.id === result.original.id ? result.original : item),
        result.replacement,
      ]);
      setSelectedId(result.replacement.id);
      setAuditCount((count) => count + result.auditEvents.length);
      setMessage("已建立隔日同時段的本機改期示範，舊預約與新預約彼此有紀錄可追查。正式改期規則仍待店家決定。");
      setError("");
    } catch (caught) {
      setError(caught instanceof DomainError ? "只有已確認的預約可以在這個示範中改期。" : "示範改期暫時無法完成。");
    }
  }

  return (
    <section className="management-shell">
      <div className="booking-notice" role="note">
        <strong>本機查詢示範</strong>
        <span>不會連到真實店家，也不會套用取消、改期、退款或插單政策。</span>
      </div>
      <div className="booking-entry-nav"><Link href="/booking">← 建立新的示範預約</Link><span>查詢／改期／取消示範</span></div>
      <div className="management-grid">
        <aside className="management-lookup">
          <p className="eyebrow">查詢預約</p>
          <h2>輸入示範編號</h2>
          <label><span>預約編號或虛構客人名稱</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="DUM-MOCK-1100" /></label>
          <button className="button" type="button" onClick={lookup}>查詢示範預約</button>
          <button className="demo-code" type="button" onClick={() => setQuery("DUM-MOCK-1100")}>使用測試編號：DUM-MOCK-1100</button>
          <div className="priority-preview"><strong>安全候補排序</strong><span>{rankedWaitlist.length} 筆只在候補／待確認範圍內排序，不會取代已確認預約。</span></div>
        </aside>

        <div className="management-result">
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {message ? <p className="staff-message" role="status">{message}</p> : null}
          {selected ? (
            <article className="management-card">
              <div className="management-card-heading"><div><p className="eyebrow">本機預約明細</p><h2>{selected.managementCodeMasked}</h2></div><span className={`status-chip status-${selected.status}`}>{labels[selected.status]}</span></div>
              <dl className="summary-list">
                <div><dt>客人</dt><dd>{customer?.name} · {customer?.phoneMasked}</dd></div>
                <div><dt>服務</dt><dd>{mockServices.find((item) => item.id === selected.serviceId)?.name}</dd></div>
                <div><dt>設計師</dt><dd>{mockStaff.find((item) => item.id === selected.staffId)?.displayName}</dd></div>
                <div><dt>時間</dt><dd>{formatDateTime(selected.startsAt)}－{formatDateTime(selected.endsAt)}</dd></div>
                <div><dt>訂金</dt><dd>{selected.depositStatus}（無真實金額或付款）</dd></div>
                <div><dt>稽核紀錄</dt><dd>本次操作新增 {auditCount} 筆示範紀錄</dd></div>
                {selected.rescheduledFromBookingId ? <div><dt>改期來源</dt><dd>{selected.rescheduledFromBookingId}</dd></div> : null}
              </dl>
              <div className="management-actions">
                <button className="button" type="button" onClick={reschedule} disabled={selected.status !== "confirmed"}>隔日同時段改期預覽</button>
                <button className="button button-secondary" type="button" onClick={cancel} disabled={!(["pending", "confirmed", "waitlisted"] as string[]).includes(selected.status)}>送出本機取消請求</button>
              </div>
            </article>
          ) : (
            <div className="inline-state"><strong>尚未載入預約</strong><span>使用左側測試編號即可查看完整流程；重新整理會恢復初始狀態。</span></div>
          )}
        </div>
      </div>
    </section>
  );
}
