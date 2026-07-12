"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { canTransitionBooking } from "@/domain/booking";
import type { Booking, CalendarBlock } from "@/domain/models";
import { customerById, customers, initialBookings, serviceById, staff, staffById } from "@/data/mock-data";

const statusLabels: Record<Booking["status"], string> = {
  pending: "待確認", confirmed: "已確認", checked_in: "已到店", in_service: "服務中", completed: "已完成", cancelled_by_customer: "客人取消", cancelled_by_shop: "店家取消", no_show: "未到", rescheduled: "已改期", waitlisted: "候補"
};

export default function StaffPage() {
  const [bookings, setBookings] = useState(initialBookings);
  const [staffId, setStaffId] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const visibleBookings = bookings.filter((item) => staffId === "all" || item.staffId === staffId);
  const selected = bookings.find((item) => item.id === selectedId);
  const nextBooking = visibleBookings.find((item) => item.status === "confirmed");
  const searchResults = useMemo(() => query.trim().length < 2 ? [] : customers.filter((item) => `${item.name}${item.phoneMasked}`.toLowerCase().includes(query.toLowerCase())), [query]);

  function completeBooking(id: string) {
    setBookings((records) => records.map((item) => item.id === id && canTransitionBooking(item.status, "completed") ? { ...item, status: "completed" } : item));
  }

  function createBlock() {
    const targetStaff = staffId === "all" ? staff[0].id : staffId;
    setBlocks((records) => [...records, { id: `block-${Date.now()}`, branchId: "branch-taipei-01", staffId: targetStaff, startsAt: "2026-07-12T18:00:00+08:00", endsAt: "2026-07-12T18:30:00+08:00", reason: "Mock 30 分鐘封鎖", source: "mock_staff_action" }]);
  }

  return (
    <PageShell eyebrow="STAFF / LOCAL PROTOTYPE" title="TODAY AT DUM." intro="手機優先的員工操作原型。所有變更只修改目前頁面的 Mock 前端狀態。">
      <section className="staff-layout container">
        <aside className="staff-sidebar">
          <div className="staff-stat"><span className="muted">今日預約</span><strong>{visibleBookings.length}</strong></div>
          <div className="staff-stat"><span className="muted">下一位客人</span><strong style={{ fontSize: "1.2rem" }}>{nextBooking ? customerById(nextBooking.customerId)?.name : "無"}</strong><p>{nextBooking ? new Date(nextBooking.startsAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }) : "—"}</p></div>
          <label>設計師篩選<select value={staffId} onChange={(event) => setStaffId(event.target.value)}><option value="all">全店</option>{staff.map((item) => <option value={item.id} key={item.id}>{item.displayName}</option>)}</select></label>
          <button className="button button-secondary" onClick={createBlock}>封鎖 30 分鐘（Mock）</button>
          {blocks.map((block) => <div className="mock-alert" key={block.id}>{staffById(block.staffId)?.displayName} · 18:00–18:30 已在前端封鎖</div>)}
          <label>搜尋虛構客戶<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="姓名或遮罩電話" /></label>
          <div className="search-results">{searchResults.map((customer) => <div className="search-result" key={customer.id}><strong>{customer.name}</strong><div className="muted">{customer.phoneMasked}</div><small>{customer.notes?.join(" · ")}</small></div>)}</div>
        </aside>

        <div>
          <div className="staff-toolbar"><div><p className="eyebrow">SUNDAY · 12 JUL 2026</p><h2>FULL DAY.</h2></div><span className="status">ASIA/TAIPEI</span></div>
          <div className="schedule">{visibleBookings.map((booking) => {
            const customer = customerById(booking.customerId);
            const member = staffById(booking.staffId);
            const service = serviceById(booking.serviceId);
            return <article className="appointment" key={booking.id}><time>{new Date(booking.startsAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })}</time><div><strong>{customer?.name}</strong><div className="muted">{service?.name} · {member?.displayName}</div><span className="status">{statusLabels[booking.status]}</span></div><button className="button button-small button-secondary" onClick={() => setSelectedId(booking.id)}>詳情</button></article>;
          })}</div>

          {selected && <div className="detail-panel"><p className="eyebrow">BOOKING DETAIL / MOCK</p><h3>{customerById(selected.customerId)?.name}</h3><p>{serviceById(selected.serviceId)?.name} · {staffById(selected.staffId)?.displayName}</p><p className="muted">{customerById(selected.customerId)?.phoneMasked} · 僅顯示最少必要的虛構資料</p><div className="hero-actions"><button className="button" disabled={!canTransitionBooking(selected.status, "completed")} onClick={() => completeBooking(selected.id)}>標記完成</button><button className="button button-secondary" onClick={() => setSelectedId(null)}>關閉</button></div>{!canTransitionBooking(selected.status, "completed") && <p className="muted">只有「服務中」預約可直接標記完成。</p>}</div>}
        </div>
      </section>
    </PageShell>
  );
}
