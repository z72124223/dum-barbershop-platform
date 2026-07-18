"use client";

import { useMemo, useState } from "react";
import { createMockPlatform } from "../../adapters";
import {
  mockBookings,
  mockBranch,
  mockCalendarBlocks,
  mockCustomers,
  mockServices,
  mockStaff,
} from "../../data/mock";
import {
  addMinutes,
  allowedBookingTransitions,
  rankSafeWaitlist,
  rescheduleBooking,
  toTaipeiInstant,
  transitionBooking,
  type Booking,
  type BookingStatus,
  type CalendarBlock,
  type LocalTime,
  type StaffRole,
} from "../../domain";
import {
  ALL_STAFF,
  buildTimeline,
  buildWeekDays,
  canPlaceBlock,
  canStaffRole,
  filterBookings,
  type StaffFilter,
} from "./staff-logic";

type OperationsView = "day" | "week" | "queue" | "customers" | "configuration";
type BlockKind = CalendarBlock["kind"];

const MOCK_ACTION_TIME = "2026-07-14T09:30:00.000Z";
const blockTimes: LocalTime[] = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
const blockDurations = [30, 60, 120] as const;
const roles: StaffRole[] = ["owner", "manager", "barber", "reception", "read_only"];

const roleLabels: Record<StaffRole, string> = {
  owner: "店主角色預覽",
  manager: "管理者角色預覽",
  barber: "設計師預覽",
  reception: "櫃台預覽",
  read_only: "唯讀預覽",
};

const statusLabels: Record<BookingStatus, string> = {
  pending: "待確認",
  confirmed: "已確認",
  checked_in: "已報到",
  in_service: "服務中",
  completed: "已完成",
  cancelled_by_customer: "客人取消",
  cancelled_by_shop: "店家取消",
  no_show: "未到店",
  rescheduled: "已改期",
  waitlisted: "候補中",
};

const transitionLabels: Partial<Record<BookingStatus, string>> = {
  confirmed: "確認預約",
  waitlisted: "移到候補",
  checked_in: "標記報到",
  in_service: "開始服務",
  completed: "完成服務",
  cancelled_by_shop: "店家取消",
  no_show: "標記未到",
};

const blockKindLabels: Record<BlockKind, string> = {
  blocked: "封鎖",
  leave: "休假",
  overtime: "加班",
};

const staffRoleNames: Record<StaffRole, string> = {
  owner: "店主",
  manager: "管理者",
  barber: "設計師",
  reception: "櫃台",
  read_only: "唯讀",
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function plusOneDay(value: string) {
  return new Date(new Date(value).getTime() + 24 * 60 * 60 * 1000).toISOString();
}

export function OperationsWorkspace() {
  const [platform] = useState(createMockPlatform);
  const [bookings, setBookings] = useState<Booking[]>(() => structuredClone(mockBookings));
  const [blocks, setBlocks] = useState<CalendarBlock[]>(() => structuredClone(mockCalendarBlocks));
  const [view, setView] = useState<OperationsView>("day");
  const [previewRole, setPreviewRole] = useState<StaffRole>("manager");
  const [staffFilter, setStaffFilter] = useState<StaffFilter>(ALL_STAFF);
  const [blockKind, setBlockKind] = useState<BlockKind>("blocked");
  const [blockDate, setBlockDate] = useState("2026-07-14");
  const [blockStart, setBlockStart] = useState<LocalTime>("12:00");
  const [blockDuration, setBlockDuration] = useState<(typeof blockDurations)[number]>(60);
  const [blockStaffId, setBlockStaffId] = useState(mockStaff[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [auditLog, setAuditLog] = useState<string[]>([]);

  const canWrite = canStaffRole(previewRole, "booking:write");
  const canReadCustomers = canStaffRole(previewRole, "customer:read") || canStaffRole(previewRole, "customer:read_assigned");
  const visibleBookings = useMemo(() => filterBookings(bookings, staffFilter), [bookings, staffFilter]);
  const dayTimeline = useMemo(() => buildTimeline(bookings, blocks, staffFilter), [bookings, blocks, staffFilter]);
  const weekDays = useMemo(() => buildWeekDays("2026-07-14", bookings, blocks, staffFilter), [bookings, blocks, staffFilter]);
  const queue = useMemo(() => rankSafeWaitlist(visibleBookings), [visibleBookings]);
  const visibleCustomers = useMemo(() => {
    if (!canReadCustomers) return [];
    if (previewRole !== "barber") return mockCustomers;
    const assignedStaffId = staffFilter === ALL_STAFF ? mockStaff[0]?.id : staffFilter;
    return mockCustomers.filter((customer) => customer.preferredStaffId === assignedStaffId);
  }, [canReadCustomers, previewRole, staffFilter]);

  function clearNotice() {
    setMessage("");
    setError("");
  }

  function recordAudit(text: string) {
    setAuditLog((current) => [`${MOCK_ACTION_TIME} · ${text}`, ...current]);
  }

  async function changeStatus(booking: Booking, to: BookingStatus) {
    clearNotice();
    if (!canWrite) {
      setError("目前是唯讀角色預覽，不能修改預約。");
      return;
    }
    try {
      const result = transitionBooking(booking, to, `preview-role-${previewRole}`, MOCK_ACTION_TIME);
      await platform.bookings.save(result.booking);
      await platform.audit.append(result.auditEvent);
      setBookings((current) => current.map((item) => item.id === result.booking.id ? result.booking : item));
      recordAudit(`${booking.id}：${statusLabels[booking.status]} → ${statusLabels[to]}`);
      setMessage(`示範狀態已更新為「${statusLabels[to]}」。`);
    } catch {
      setError("操作被 Domain 規則或時段衝突拒絕，資料沒有變更。");
    }
  }

  async function reschedule(booking: Booking) {
    clearNotice();
    if (!canWrite) {
      setError("目前角色不能改期。");
      return;
    }
    const replacement: Booking = {
      ...booking,
      id: `${booking.id}-staff-r${bookings.length}`,
      startsAt: plusOneDay(booking.startsAt),
      endsAt: plusOneDay(booking.endsAt),
      status: "pending",
      managementCodeMasked: `DUM-MOCK-STAFF-R${bookings.length}`,
      createdAt: MOCK_ACTION_TIME,
      updatedAt: MOCK_ACTION_TIME,
      source: "mock_staff",
      rescheduledFromBookingId: undefined,
      rescheduledToBookingId: undefined,
    };
    try {
      const result = rescheduleBooking(booking, replacement, `preview-role-${previewRole}`, MOCK_ACTION_TIME);
      await platform.bookings.save(result.original);
      await platform.bookings.create({ booking: result.replacement, idempotencyKey: result.replacement.id });
      for (const event of result.auditEvents) await platform.audit.append(event);
      setBookings((current) => [...current.map((item) => item.id === result.original.id ? result.original : item), result.replacement]);
      recordAudit(`${booking.id} 改期至 ${result.replacement.id}`);
      setMessage("已建立隔日同時段的示範改期，新舊預約可互相追查。");
    } catch {
      setError("只有已確認且無衝突的預約可以使用這個改期預覽。");
    }
  }

  async function createScheduleBlock() {
    clearNotice();
    if (!canWrite) {
      setError("目前角色不能修改行程。");
      return;
    }
    const startsAt = toTaipeiInstant(blockDate as `${number}-${number}-${number}`, blockStart);
    const candidate: CalendarBlock = {
      id: `block-operations-${blocks.length + 1}`,
      branchId: mockBranch.id,
      staffId: blockStaffId,
      startsAt: startsAt.toISOString(),
      endsAt: addMinutes(startsAt, blockDuration).toISOString(),
      kind: blockKind,
      reason: `虛構${blockKindLabels[blockKind]}行程`,
      source: "mock_staff_action",
    };
    if (!canPlaceBlock(candidate, bookings, blocks)) {
      setError("同一位設計師的這段時間已有預約或其他安排，沒有建立行程。");
      return;
    }
    await platform.calendar.createBlock(candidate);
    setBlocks((current) => [...current, candidate]);
    recordAudit(`${candidate.staffId} 新增 ${candidate.kind} ${formatTime(candidate.startsAt)}–${formatTime(candidate.endsAt)}`);
    setMessage("已加入本機行程預覽；不會同步到真實日曆。");
  }

  return (
    <section className="operations-shell">
      <div className="staff-warning" role="note"><strong>本機角色預覽 · 無正式登入</strong><span>切換角色只會改變畫面權限，不代表任何人已通過身分驗證。</span></div>
      <div className="operations-toolbar">
        <div className="operations-tabs" role="tablist" aria-label="營運檢視">
          {(["day", "week", "queue", "customers", "configuration"] as OperationsView[]).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={view === item} onClick={() => { setView(item); clearNotice(); }}>{({ day: "日", week: "週", queue: "待處理", customers: "客戶", configuration: "設定" })[item]}</button>
          ))}
        </div>
        <div className="operations-filters">
          <label><span>角色預覽</span><select value={previewRole} onChange={(event) => setPreviewRole(event.target.value as StaffRole)}>{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
          <label><span>設計師</span><select value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)}><option value={ALL_STAFF}>全店</option>{mockStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.displayName}</option>)}</select></label>
        </div>
      </div>
      <div className="permission-strip"><span>{roleLabels[previewRole]}</span><strong>{canWrite ? "可操作預約與行程" : "僅可查看行程"}</strong><small>本次稽核 {auditLog.length} 筆</small></div>
      {message ? <p className="staff-message" role="status">{message}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      {view === "day" ? (
        <div className="operations-two-column">
          <div className="operations-list"><div className="operations-heading"><div><p className="eyebrow">單日營運 · 2026-07-14</p><h2>日營運</h2></div><span>{dayTimeline.length} 個項目</span></div>{dayTimeline.map((item) => item.kind === "block" ? <article className={`operation-row block-${item.block.kind}`} key={item.id}><time>{formatTime(item.startsAt)}–{formatTime(item.endsAt)}</time><div><strong>{blockKindLabels[item.block.kind]}</strong><span>{mockStaff.find((staff) => staff.id === item.staffId)?.displayName} · {item.block.reason}</span></div></article> : <BookingOperationRow key={item.id} booking={item.booking} canWrite={canWrite} onStatus={changeStatus} onReschedule={reschedule} />)}</div>
          <ScheduleEditor kind={blockKind} setKind={setBlockKind} date={blockDate} setDate={setBlockDate} start={blockStart} setStart={setBlockStart} duration={blockDuration} setDuration={setBlockDuration} staffId={blockStaffId} setStaffId={setBlockStaffId} onCreate={createScheduleBlock} disabled={!canWrite} />
        </div>
      ) : null}

      {view === "week" ? <div className="week-grid">{weekDays.map((day) => <article key={day.date} className="week-day"><header><strong>{day.date}</strong><span>{day.bookings.length} 預約 · {day.blocks.length} 行程</span></header>{day.bookings.length + day.blocks.length === 0 ? <p>無示範行程</p> : <>{day.bookings.map((booking) => <div key={booking.id}><time>{formatTime(booking.startsAt)}</time><span>{mockStaff.find((staff) => staff.id === booking.staffId)?.displayName}</span><small>{statusLabels[booking.status]}</small></div>)}{day.blocks.map((block) => <div key={block.id}><time>{formatTime(block.startsAt)}</time><span>{blockKindLabels[block.kind]}</span><small>{mockStaff.find((staff) => staff.id === block.staffId)?.displayName}</small></div>)}</>}</article>)}</div> : null}

      {view === "queue" ? <div className="queue-panel"><div className="operations-heading"><div><p className="eyebrow">安全候補排序</p><h2>待確認與候補</h2></div><span>不取代已確認預約</span></div>{queue.length ? queue.map((booking, index) => <article key={booking.id} className="queue-row"><span>#{index + 1}</span><div><strong>{mockCustomers.find((customer) => customer.id === booking.customerId)?.name}</strong><small>{statusLabels[booking.status]} · {booking.depositStatus === "paid" ? "示範已付欄位" : "無付款優先承諾"}</small></div><button type="button" disabled={!canWrite} onClick={() => changeStatus(booking, "confirmed")}>確認（遇衝突會拒絕）</button></article>) : <div className="inline-state"><strong>沒有待處理項目</strong><span>目前不需要人工處理。</span></div>}</div> : null}

      {view === "customers" ? canReadCustomers ? <div className="customer-operations-grid">{visibleCustomers.map((customer) => <article key={customer.id}><header><div><strong>{customer.name}</strong><span>{customer.phoneMasked}</span></div><small>偏好設計師：{mockStaff.find((staff) => staff.id === customer.preferredStaffId)?.displayName ?? "無"}</small></header><section><h3>服務偏好</h3>{customer.preferences?.map((item) => <p key={item}>{item}</p>) ?? <p>無</p>}</section><section><h3>技術紀錄</h3>{customer.technicalNotes?.length ? customer.technicalNotes.map((note) => <div key={note.id}><strong>{note.authorLabel}</strong><span>{note.content}</span></div>) : <p>無示範技術紀錄</p>}</section><details><summary>歷史紀錄 {customer.history.length} 筆</summary>{customer.history.map((entry) => <p key={entry.id}>{entry.serviceLabel} · {entry.summary}</p>)}</details></article>)}</div> : <div className="inline-state"><strong>此角色不能查看客戶資料</strong><span>請切換店主、管理者、櫃台或設計師角色預覽。</span></div> : null}

      {view === "configuration" ? canStaffRole(previewRole, "settings:preview") ? <div className="configuration-grid"><section><p className="eyebrow">人員與角色</p><h2>人員與值班能力</h2>{mockStaff.map((staff) => <article key={staff.id}><div><strong>{staff.displayName}</strong><span>{staffRoleNames[staff.role]} · {staff.active ? "啟用" : "停用"}</span></div><p>{staff.specialties.join(" · ")}</p><small>可服務 {staff.serviceIds.length} 項 · 每週 {staff.schedule.days.length} 個排班日</small></article>)}</section><section><p className="eyebrow">服務能力設定</p><h2>服務設定預覽</h2>{mockServices.map((service) => <article key={service.id}><div><strong>{service.name}</strong><span>{service.durationMinutes} 分鐘</span></div><p>{service.description}</p><small>價格待店主決定 · 緩衝 {service.bufferBeforeMinutes}/{service.bufferAfterMinutes} 分鐘</small></article>)}</section></div> : <div className="inline-state"><strong>此角色不能查看設定預覽</strong><span>只有店主或管理者角色預覽可查看服務、人員與排班設定。</span></div> : null}

      {auditLog.length ? <details className="audit-preview"><summary>查看本次示範稽核紀錄（{auditLog.length}）</summary>{auditLog.map((entry) => <p key={entry}>{entry}</p>)}</details> : null}
    </section>
  );
}

function BookingOperationRow({ booking, canWrite, onStatus, onReschedule }: { booking: Booking; canWrite: boolean; onStatus: (booking: Booking, to: BookingStatus) => void; onReschedule: (booking: Booking) => void }) {
  const transitions = allowedBookingTransitions(booking.status).filter((status) => status !== "cancelled_by_customer" && status !== "rescheduled");
  return <article className="operation-booking"><div><time>{formatTime(booking.startsAt)}–{formatTime(booking.endsAt)}</time><strong>{mockCustomers.find((customer) => customer.id === booking.customerId)?.name}</strong><span>{mockStaff.find((staff) => staff.id === booking.staffId)?.displayName} · {statusLabels[booking.status]}</span></div><div className="operation-actions">{transitions.map((status) => <button key={status} type="button" disabled={!canWrite} onClick={() => onStatus(booking, status)}>{transitionLabels[status] ?? statusLabels[status]}</button>)}{booking.status === "confirmed" ? <button type="button" disabled={!canWrite} onClick={() => onReschedule(booking)}>改期＋保留紀錄</button> : null}</div></article>;
}

function ScheduleEditor({ kind, setKind, date, setDate, start, setStart, duration, setDuration, staffId, setStaffId, onCreate, disabled }: { kind: BlockKind; setKind: (value: BlockKind) => void; date: string; setDate: (value: string) => void; start: LocalTime; setStart: (value: LocalTime) => void; duration: (typeof blockDurations)[number]; setDuration: (value: (typeof blockDurations)[number]) => void; staffId: string; setStaffId: (value: string) => void; onCreate: () => void; disabled: boolean }) {
  return <aside className="schedule-editor"><p className="eyebrow">排班編輯 · 本機示範</p><h3>新增行程</h3><p>可預覽一般封鎖、休假與加班；同人同時段衝突會被拒絕。</p><label><span>類型</span><select value={kind} onChange={(event) => setKind(event.target.value as BlockKind)}><option value="blocked">封鎖</option><option value="leave">休假</option><option value="overtime">加班</option></select></label><label><span>設計師</span><select value={staffId} onChange={(event) => setStaffId(event.target.value)}>{mockStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.displayName}</option>)}</select></label><label><span>日期</span><select value={date} onChange={(event) => setDate(event.target.value)}>{["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18", "2026-07-19", "2026-07-20"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span>開始</span><select value={start} onChange={(event) => setStart(event.target.value as LocalTime)}>{blockTimes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span>長度</span><select value={duration} onChange={(event) => setDuration(Number(event.target.value) as (typeof blockDurations)[number])}>{blockDurations.map((item) => <option key={item} value={item}>{item} 分鐘</option>)}</select></label><button className="button" type="button" disabled={disabled} onClick={onCreate}>新增本機行程</button></aside>;
}
