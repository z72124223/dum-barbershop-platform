"use client";

import { useMemo, useState } from "react";
import { createMockPlatform } from "../../adapters";
import { mockBookings, mockBranch, mockCalendarBlocks, mockCustomers, mockServices, mockStaff } from "../../data/mock";
import {
  addMinutes,
  allowedBookingTransitions,
  canStaffRole,
  toTaipeiInstant,
  transitionBooking,
  type Booking,
  type BookingStatus,
  type CalendarBlock,
  type Customer,
  type EntityId,
  type LocalTime,
} from "../../domain";
import {
  ALL_STAFF,
  buildTimeline,
  canPlaceBlock,
  filterBookings,
  filterMockCustomersForIdentity,
  findNextBooking,
  isBookingInMockIdentityScope,
  resolveMockStaffFilter,
  type StaffFilter,
} from "./staff-logic";
import { useStaffAuth } from "./staff-auth";

const statusLabels: Record<BookingStatus, string> = {
  pending: "待確認",
  confirmed: "已確認",
  checked_in: "已到店",
  in_service: "服務中",
  completed: "已完成",
  cancelled_by_customer: "客人取消",
  cancelled_by_shop: "店家取消",
  no_show: "未到店",
  rescheduled: "已改期",
  waitlisted: "等候名單",
};

const primaryActions: Partial<Record<BookingStatus, { to: BookingStatus; label: string }>> = {
  pending: { to: "confirmed", label: "確認示範預約" },
  confirmed: { to: "checked_in", label: "標記已到店" },
  checked_in: { to: "in_service", label: "開始服務" },
  in_service: { to: "completed", label: "標記完成" },
};

const blockTimes: LocalTime[] = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const MOCK_NOW = "2026-07-14T04:30:00.000Z";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function customerFor(booking: Booking | null): Customer | undefined {
  return booking ? mockCustomers.find((customer) => customer.id === booking.customerId) : undefined;
}

export function StaffWorkspace() {
  const { session } = useStaffAuth();
  const signedInRole = session?.identity.role ?? "read_only";
  const identityStaffId = session?.identity.staffId;
  const isBarber = signedInRole === "barber";
  const [platform] = useState(createMockPlatform);
  const [bookings, setBookings] = useState<Booking[]>(() => structuredClone(mockBookings));
  const [blocks, setBlocks] = useState<CalendarBlock[]>(() => structuredClone(mockCalendarBlocks));
  const [staffFilter, setStaffFilter] = useState<StaffFilter>(ALL_STAFF);
  const [view, setView] = useState<"today" | "schedule" | "customers">("today");
  const [selectedBookingId, setSelectedBookingId] = useState<EntityId>(mockBookings[0]?.id ?? "");
  const [customerQuery, setCustomerQuery] = useState("");
  const [blockStaffId, setBlockStaffId] = useState(mockStaff[0]?.id ?? "");
  const [blockStart, setBlockStart] = useState<LocalTime>("12:00");
  const [blockDuration, setBlockDuration] = useState<30 | 60>(30);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [auditCount, setAuditCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const scopedStaffFilter = resolveMockStaffFilter(signedInRole, identityStaffId, staffFilter);
  const scopedBlockStaffId = isBarber ? identityStaffId ?? "" : blockStaffId;
  const linkedStaff = isBarber ? mockStaff.find((staff) => staff.id === identityStaffId) : undefined;
  const hasIdentityStaffScope = !isBarber || Boolean(linkedStaff);
  const canWrite = canStaffRole(signedInRole, "booking:write") && hasIdentityStaffScope;
  const canReadCustomers = canStaffRole(signedInRole, "customer:read") || (
    canStaffRole(signedInRole, "customer:read_assigned") && hasIdentityStaffScope
  );
  const visibleBookings = useMemo(
    () => scopedStaffFilter === null ? [] : filterBookings(bookings, scopedStaffFilter),
    [bookings, scopedStaffFilter],
  );
  const nextBooking = useMemo(
    () => scopedStaffFilter === null ? null : findNextBooking(bookings, scopedStaffFilter, MOCK_NOW),
    [bookings, scopedStaffFilter],
  );
  const timeline = useMemo(
    () => scopedStaffFilter === null ? [] : buildTimeline(bookings, blocks, scopedStaffFilter),
    [bookings, blocks, scopedStaffFilter],
  );
  const selectedBooking = visibleBookings.find((booking) => booking.id === selectedBookingId) ?? visibleBookings[0] ?? null;
  const selectedCustomer = customerFor(selectedBooking);
  const selectedService = selectedBooking ? mockServices.find((service) => service.id === selectedBooking.serviceId) : undefined;
  const selectedStaff = selectedBooking ? mockStaff.find((staff) => staff.id === selectedBooking.staffId) : undefined;
  const nextCustomer = customerFor(nextBooking);
  const pendingCount = visibleBookings.filter((booking) => booking.status === "pending").length;
  const waitlistCount = visibleBookings.filter((booking) => booking.status === "waitlisted").length;
  const customerResults = useMemo(() => {
    if (!canReadCustomers) return [];
    const scopedCustomers = filterMockCustomersForIdentity(mockCustomers, signedInRole, identityStaffId);
    const normalized = customerQuery.trim().toLocaleLowerCase("zh-TW");
    if (!normalized) return scopedCustomers;
    return scopedCustomers.filter((customer) =>
      `${customer.name} ${customer.phoneMasked}`.toLocaleLowerCase("zh-TW").includes(normalized),
    );
  }, [canReadCustomers, customerQuery, identityStaffId, signedInRole]);

  async function applyPrimaryAction() {
    if (!selectedBooking) return;
    if (!canWrite) {
      setError("目前登入角色只有查看權限，不能修改預約狀態。");
      return;
    }
    if (!isBookingInMockIdentityScope(selectedBooking, signedInRole, identityStaffId)) {
      setError("此本機 Mock 設計師身份只能修改綁定給自己的預約。");
      return;
    }
    const action = primaryActions[selectedBooking.status];
    if (!action || !allowedBookingTransitions(selectedBooking.status).includes(action.to)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = transitionBooking(selectedBooking, action.to, "staff-mock-ui", new Date().toISOString());
      await platform.bookings.save(result.booking);
      await platform.audit.append(result.auditEvent);
      setBookings((current) => current.map((booking) => booking.id === result.booking.id ? result.booking : booking));
      setAuditCount((count) => count + 1);
      setMessage(`已完成示範狀態更新：${statusLabels[result.booking.status]}。`);
    } catch {
      setError("這個狀態目前不能這樣變更，畫面沒有修改資料。");
    } finally {
      setBusy(false);
    }
  }

  async function createBlock() {
    setError("");
    setMessage("");
    if (!canWrite) {
      setError("目前登入角色只有查看權限，不能建立封鎖時間。");
      return;
    }
    if (!scopedBlockStaffId) {
      setError("此本機 Mock 身份尚未綁定示範設計師，不能建立封鎖時間。");
      return;
    }
    const startsAt = toTaipeiInstant("2026-07-14", blockStart);
    const candidate: CalendarBlock = {
      id: `block-local-${Date.now()}`,
      branchId: mockBranch.id,
      staffId: scopedBlockStaffId,
      startsAt: startsAt.toISOString(),
      endsAt: addMinutes(startsAt, blockDuration).toISOString(),
      kind: "blocked",
      reason: "員工工作台建立的虛構封鎖時間",
      source: "mock_staff_action",
    };
    if (!canPlaceBlock(candidate, bookings, blocks)) {
      setError("這段時間已有行程或封鎖，請換一個時間。不同設計師不會互相影響。");
      return;
    }
    await platform.calendar.createBlock(candidate);
    setBlocks((current) => [...current, candidate]);
    setMessage(`已替 ${mockStaff.find((staff) => staff.id === scopedBlockStaffId)?.displayName} 建立 ${blockDuration} 分鐘示範封鎖。`);
  }

  function selectBooking(id: EntityId) {
    setSelectedBookingId(id);
    setMessage("");
    setError("");
  }

  function changeView(nextView: "today" | "schedule" | "customers") {
    setView(nextView);
    setMessage("");
    setError("");
  }

  return (
    <section className="staff-shell">
      <div className="staff-warning" role="note">
        <strong>員工操作原型 · 已套用 Mock 登入角色</strong>
        <span>{isBarber ? "設計師示範身份只顯示綁定設計師的假資料；這不是正式員工可見範圍政策。" : canWrite ? "目前角色可操作本機假資料。" : "目前角色只有查看權限。"} 這仍不可拿來管理真實客人或門市行程。</span>
      </div>

      <div className="staff-toolbar">
        <div className="staff-tabs" role="tablist" aria-label="員工功能">
          <button type="button" role="tab" aria-selected={view === "today"} onClick={() => changeView("today")}>今日</button>
          <button type="button" role="tab" aria-selected={view === "schedule"} onClick={() => changeView("schedule")}>全日行程</button>
          <button type="button" role="tab" aria-selected={view === "customers"} disabled={!canReadCustomers} onClick={() => changeView("customers")}>客戶搜尋</button>
        </div>
        <label className="staff-filter"><span>設計師篩選</span><select value={scopedStaffFilter ?? ""} disabled={isBarber} onChange={(event) => setStaffFilter(event.target.value)}>{isBarber ? <option value={identityStaffId ?? ""}>{linkedStaff?.displayName ?? "未綁定示範設計師"}</option> : <><option value={ALL_STAFF}>全店示範行程</option>{mockStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.displayName}</option>)}</>}</select></label>
      </div>

      {message ? <p className="staff-message" role="status">{message}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      {view === "today" ? (
        <>
          <div className="staff-metrics">
            <article><span>今日示範預約</span><strong>{visibleBookings.filter((booking) => booking.status !== "waitlisted").length}</strong></article>
            <article><span>待確認</span><strong>{pendingCount}</strong></article>
            <article><span>等候名單</span><strong>{waitlistCount}</strong></article>
            <article><span>本次稽核紀錄</span><strong>{auditCount}</strong></article>
          </div>
          <div className="staff-dashboard">
            <article className="next-customer-card">
              <p className="eyebrow">下一位客人 · 示範資料</p>
              {nextBooking ? <><strong>{formatTime(nextBooking.startsAt)}</strong><h2>{nextCustomer?.name}</h2><p>{mockServices.find((service) => service.id === nextBooking.serviceId)?.name} · {mockStaff.find((staff) => staff.id === nextBooking.staffId)?.displayName}</p><button className="button button-secondary" type="button" onClick={() => selectBooking(nextBooking.id)}>查看預約</button></> : <p>目前沒有下一位示範客人。</p>}
            </article>
            <div className="staff-booking-list" aria-label="今日示範預約">
              {visibleBookings.map((booking) => {
                const customer = customerFor(booking);
                const staff = mockStaff.find((member) => member.id === booking.staffId);
                return <button key={booking.id} type="button" className={selectedBooking?.id === booking.id ? "selected" : ""} onClick={() => selectBooking(booking.id)}><span>{formatTime(booking.startsAt)}</span><strong>{customer?.name}</strong><small>{staff?.displayName} · {statusLabels[booking.status]}</small></button>;
              })}
            </div>
          </div>
          <BookingDetail booking={selectedBooking} customer={selectedCustomer} serviceLabel={selectedService?.name} staffLabel={selectedStaff?.displayName} busy={busy} canWrite={canWrite} onAction={applyPrimaryAction} />
        </>
      ) : null}

      {view === "schedule" ? (
        <div className="schedule-layout">
          <div className="staff-timeline">
            <div className="timeline-heading"><div><p className="eyebrow">全日行程 · 2026-07-14</p><h2>全日示範行程</h2></div><span>{timeline.length} 個項目</span></div>
            {timeline.map((item) => {
              const staff = mockStaff.find((member) => member.id === item.staffId);
              if (item.kind === "block") return <article key={item.id} className="timeline-item block"><time>{formatTime(item.startsAt)}–{formatTime(item.endsAt)}</time><div><strong>封鎖時間</strong><span>{staff?.displayName} · {item.block.reason}</span></div></article>;
              const customer = customerFor(item.booking);
              return <button key={item.id} type="button" className="timeline-item booking" onClick={() => { selectBooking(item.id); setView("today"); }}><time>{formatTime(item.startsAt)}–{formatTime(item.endsAt)}</time><div><strong>{customer?.name}</strong><span>{staff?.displayName} · {statusLabels[item.booking.status]}</span></div></button>;
            })}
          </div>
          <aside className="block-panel">
            <p className="eyebrow">封鎖時間 · 本機示範</p><h3>建立封鎖時間</h3><p>只影響所選設計師；若已有預約或封鎖，系統會拒絕。</p>
            <label><span>設計師</span><select value={scopedBlockStaffId} disabled={isBarber} onChange={(event) => setBlockStaffId(event.target.value)}>{isBarber ? <option value={identityStaffId ?? ""}>{linkedStaff?.displayName ?? "未綁定示範設計師"}</option> : mockStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.displayName}</option>)}</select></label>
            <label><span>開始時間</span><select value={blockStart} onChange={(event) => setBlockStart(event.target.value as LocalTime)}>{blockTimes.map((time) => <option key={time} value={time}>{time}</option>)}</select></label>
            <label><span>長度</span><select value={blockDuration} onChange={(event) => setBlockDuration(Number(event.target.value) as 30 | 60)}><option value={30}>30 分鐘</option><option value={60}>60 分鐘</option></select></label>
            <button className="button" type="button" disabled={!canWrite} onClick={createBlock}>建立示範封鎖</button>
          </aside>
        </div>
      ) : null}

      {view === "customers" ? (
        <div className="customer-search-panel">
          <div><p className="eyebrow">客戶搜尋 · 虛構資料</p><h2>客戶示範紀錄</h2><label className="search-field"><span>搜尋姓名或遮罩電話</span><input value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} placeholder="例如：二號示範客人" /></label></div>
          <div className="customer-results">{customerResults.length > 0 ? customerResults.map((customer) => <article key={customer.id}><div><strong>{customer.name}</strong><span>{customer.phoneMasked}</span></div><p>上次到店：{customer.lastVisitAt ? new Intl.DateTimeFormat("zh-TW", {timeZone:"Asia/Taipei",dateStyle:"medium"}).format(new Date(customer.lastVisitAt)) : "無示範紀錄"}</p><p>備註：{customer.notes.join("；") || "無"}</p><details><summary>查看歷史 ({customer.history.length})</summary>{customer.history.length > 0 ? customer.history.map((history) => <div key={history.id} className="history-row"><strong>{history.serviceLabel}</strong><span>{history.staffLabel} · {history.summary}</span></div>) : <p>目前沒有虛構歷史紀錄。</p>}</details></article>) : <div className="inline-state"><strong>找不到示範客戶</strong><span>請更換姓名或遮罩電話關鍵字。</span></div>}</div>
        </div>
      ) : null}
    </section>
  );
}

function BookingDetail({ booking, customer, serviceLabel, staffLabel, busy, canWrite, onAction }: { booking: Booking | null; customer?: Customer; serviceLabel?: string; staffLabel?: string; busy: boolean; canWrite: boolean; onAction: () => void }) {
  if (!booking) return <div className="inline-state"><strong>尚未選擇預約</strong><span>從今日行程選一位示範客人查看。</span></div>;
  const action = primaryActions[booking.status];
  return <article className="booking-detail"><div><p className="eyebrow">預約明細 · 示範資料</p><h2>{customer?.name}</h2><p>{customer?.phoneMasked} · {serviceLabel}</p></div><dl className="summary-list"><div><dt>時間</dt><dd>{formatTime(booking.startsAt)}–{formatTime(booking.endsAt)}</dd></div><div><dt>設計師</dt><dd>{staffLabel}</dd></div><div><dt>狀態</dt><dd>{statusLabels[booking.status]}</dd></div><div><dt>訂金</dt><dd>{booking.depositStatus}（僅資料欄位）</dd></div><div><dt>備註</dt><dd>{booking.note || "無"}</dd></div></dl>{action ? <button className="button" type="button" disabled={busy || !canWrite} onClick={onAction}>{busy ? "更新中…" : canWrite ? action.label : "目前角色僅可查看"}</button> : <span className="status-terminal">此狀態目前沒有下一個日常操作。</span>}</article>;
}
