import {
  taipeiSlotDateTime,
  type MvpScheduleEntry,
} from "@/domain";
import {
  formatMvpDate,
  staffLabel,
} from "@/features/schedule/mvp-schedule-config";

interface ScheduleEntryCardProps {
  entry: MvpScheduleEntry;
  showDate?: boolean;
}

export function ScheduleEntryCard({
  entry,
  showDate = false,
}: ScheduleEntryCardProps) {
  const dateTime = taipeiSlotDateTime(entry.date, entry.startTime);

  return (
    <article className={`agenda-entry ${entry.kind}`}>
      <div className="entry-when">
        {showDate ? (
          <span className="entry-date">
            <strong>{formatMvpDate(entry.date)}</strong>
            <small>{entry.date}</small>
          </span>
        ) : null}
        <time dateTime={dateTime}>{entry.startTime}</time>
      </div>
      <div className="entry-type">
        <span>{entry.kind === "booking" ? "預約" : "註記"}</span>
      </div>
      <div className="entry-content">
        <div>
          <strong>{entry.kind === "booking" ? entry.customerName : entry.title}</strong>
          <small>{staffLabel(entry.staffId)}</small>
        </div>
        {entry.kind === "booking" ? <span>{entry.phone}</span> : null}
        <p>{entry.note || "無備註"}</p>
      </div>
    </article>
  );
}
