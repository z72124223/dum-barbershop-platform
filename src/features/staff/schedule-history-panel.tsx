"use client";

import { useMemo, useState } from "react";
import {
  defaultTaipeiHistoryRange,
  queryPastMvpScheduleEntries,
  taipeiToday,
  type MvpScheduleEntry,
  type MvpScheduleQueryKind,
} from "@/domain";
import { MVP_STAFF_OPTIONS } from "@/features/schedule/mvp-schedule-config";
import { ScheduleEntryCard } from "@/features/staff/schedule-entry-card";

interface ScheduleHistoryPanelProps {
  entries: readonly MvpScheduleEntry[];
  now: Date;
  ready: boolean;
}

type HistoryStaffFilter = "all" | string;

export function ScheduleHistoryPanel({
  entries,
  now,
  ready,
}: ScheduleHistoryPanelProps) {
  const [initialRange] = useState(() => defaultTaipeiHistoryRange(now));
  const [fromDate, setFromDate] = useState(initialRange.fromDate);
  const [toDate, setToDate] = useState(initialRange.toDate);
  const [staffId, setStaffId] = useState<HistoryStaffFilter>("all");
  const [kind, setKind] = useState<MvpScheduleQueryKind>("all");
  const today = taipeiToday(now);

  const result = useMemo(
    () => queryPastMvpScheduleEntries(entries, {
      fromDate,
      toDate,
      staffId: staffId === "all" ? undefined : staffId,
      kind,
      now,
    }),
    [entries, fromDate, kind, now, staffId, toDate],
  );

  function resetRange() {
    const range = defaultTaipeiHistoryRange(now);
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    setStaffId("all");
    setKind("all");
  }

  const historyEntries = result.ok ? result.entries : [];

  return (
    <div className="agenda-layout history-layout">
      <aside className="agenda-controls">
        <div>
          <p className="eyebrow">HISTORY</p>
          <h2>過往紀錄</h2>
        </div>
        <label>
          <span>開始日期</span>
          <input
            type="date"
            value={fromDate}
            max={toDate || today}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>
        <label>
          <span>結束日期</span>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            max={today}
            onChange={(event) => setToDate(event.target.value)}
          />
        </label>
        <label>
          <span>職員</span>
          <select
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
          >
            <option value="all">全部</option>
            {MVP_STAFF_OPTIONS.map((staff) => (
              <option key={staff.id} value={staff.id}>{staff.shortLabel}</option>
            ))}
          </select>
        </label>
        <label>
          <span>資料類型</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as MvpScheduleQueryKind)}
          >
            <option value="all">全部</option>
            <option value="booking">預約</option>
            <option value="note">文字註記</option>
          </select>
        </label>
        <button className="button button-secondary" type="button" onClick={resetRange}>
          重設最近 30 天
        </button>
      </aside>

      <div className="agenda-panel">
        <header>
          <div>
            <p className="eyebrow">ASIA / TAIPEI</p>
            <h2>歷史時段與當時註記</h2>
          </div>
          <span>{historyEntries.length} 筆</span>
        </header>

        <p className="timezone-note">
          僅列出台灣台北目前時間以前已開始的時段；預約備註與獨立文字註記會分開顯示。
        </p>

        {!ready ? <p className="inline-state" role="status">正在讀取本機歷史…</p> : null}
        {!result.ok ? (
          <p className="form-error" role="alert">
            請確認日期完整，且開始日期不得晚於結束日期。
          </p>
        ) : null}
        {ready && result.ok && historyEntries.length === 0 ? (
          <div className="empty-state">
            <strong>這個範圍沒有過往資料</strong>
            <span>調整日期、職員或資料類型後再查詢。</span>
          </div>
        ) : null}
        {result.ok ? (
          <div className="agenda-list history-list">
            {historyEntries.map((entry) => (
              <ScheduleEntryCard key={entry.id} entry={entry} showDate />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
