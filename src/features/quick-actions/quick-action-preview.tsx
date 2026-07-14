"use client";

import { useMemo, useState } from "react";
import { mockBookings, mockCalendarBlocks, mockCustomers, mockServices, mockStaff } from "../../data/mock";
import type { Booking, BookingStatus } from "../../domain";
import { buildQuickActionSnapshot } from "./quick-action-logic";

type QuickView = "today" | "next" | "blocks" | "checked_in" | "completed";

const viewLabels: Record<QuickView, string> = {
  today: "Today",
  next: "Next",
  blocks: "Blocks",
  checked_in: "Checked In",
  completed: "Completed",
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

const mockNow = "2026-07-14T04:30:00.000Z";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

export function QuickActionPreview() {
  const [view, setView] = useState<QuickView>("today");
  const demoBookings = useMemo<Booking[]>(() => [
    ...mockBookings,
    { ...mockBookings[0]!, id: "booking-watch-checked-in", startsAt: "2026-07-14T08:00:00.000Z", endsAt: "2026-07-14T09:00:00.000Z", status: "checked_in" },
    { ...mockBookings[1]!, id: "booking-watch-completed", startsAt: "2026-07-14T01:00:00.000Z", endsAt: "2026-07-14T02:00:00.000Z", status: "completed" },
  ], []);
  const snapshot = useMemo(() => buildQuickActionSnapshot(demoBookings, mockCalendarBlocks, mockNow), [demoBookings]);
  const counts: Record<QuickView, number> = {
    today: snapshot.today.length,
    next: snapshot.next ? 1 : 0,
    blocks: snapshot.blocks.length,
    checked_in: snapshot.checkedIn.length,
    completed: snapshot.completed.length,
  };

  return (
    <section className="quick-action-shell">
      <div className="staff-warning" role="note"><strong>APPLE-STYLE QUICK ACTION PREVIEW</strong><span>這是響應式網頁畫面，不是 watchOS App，也不需要 Apple 開發者帳號。</span></div>
      <div className="quick-action-layout">
        <div className="watch-frame" aria-label="行動裝置捷徑預覽">
          <div className="watch-screen">
            <header><span>DUM / MOCK</span><strong>{viewLabels[view]}</strong></header>
            <QuickActionContent view={view} snapshot={snapshot} />
            <small>Local data · No sync</small>
          </div>
          <span className="watch-crown" />
        </div>
        <div className="quick-action-menu">
          <div><p className="eyebrow">QUICK ACTIONS</p><h2>一眼看懂現場</h2><p>同一套預約資料可縮成行動捷徑；目前只做網頁預覽，不聲稱已安裝到任何 Apple 裝置。</p></div>
          {(["today", "next", "blocks", "checked_in", "completed"] as QuickView[]).map((item) => <button key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)}><span>{viewLabels[item]}</span><strong>{counts[item]}</strong></button>)}
        </div>
      </div>
    </section>
  );
}

function QuickActionContent({ view, snapshot }: { view: QuickView; snapshot: ReturnType<typeof buildQuickActionSnapshot> }) {
  if (view === "blocks") return <div className="watch-list">{snapshot.blocks.map((block) => <article key={block.id}><time>{formatTime(block.startsAt)}</time><strong>{block.kind}</strong><span>{mockStaff.find((staff) => staff.id === block.staffId)?.displayName}</span></article>)}</div>;
  if (view === "next") return snapshot.next ? <WatchBooking booking={snapshot.next} featured /> : <WatchEmpty />;
  const records = view === "today" ? snapshot.today : view === "checked_in" ? snapshot.checkedIn : snapshot.completed;
  return records.length ? <div className="watch-list">{records.map((booking) => <WatchBooking key={booking.id} booking={booking} />)}</div> : <WatchEmpty />;
}

function WatchBooking({ booking, featured = false }: { booking: Booking; featured?: boolean }) {
  return <article className={featured ? "watch-featured" : ""}><time>{formatTime(booking.startsAt)}</time><strong>{mockCustomers.find((customer) => customer.id === booking.customerId)?.name}</strong><span>{mockServices.find((service) => service.id === booking.serviceId)?.name}</span><small>{statusLabels[booking.status]}</small></article>;
}

function WatchEmpty() {
  return <div className="watch-empty"><strong>All clear</strong><span>目前沒有項目</span></div>;
}
