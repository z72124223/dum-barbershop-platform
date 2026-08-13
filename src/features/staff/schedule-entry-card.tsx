"use client";

import {
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  taipeiSlotDateTime,
  type StaffScheduleEntryDto,
} from "@/domain";
import {
  formatMvpDate,
} from "@/features/schedule/mvp-schedule-config";
import {
  scheduleEntryEditorCapability,
  SCHEDULE_ENTRY_READ_ONLY_MESSAGE,
} from "@/features/staff/schedule-entry-card-capability";

interface ScheduleEntryCardProps {
  entry: StaffScheduleEntryDto;
  staffLabel: string;
  showDate?: boolean;
  onSaveNote?: (
    entry: StaffScheduleEntryDto,
    nextNote: string,
  ) => Promise<string | null>;
}

export function ScheduleEntryCard({
  entry,
  staffLabel,
  showDate = false,
  onSaveNote,
}: ScheduleEntryCardProps) {
  const dateTime = taipeiSlotDateTime(entry.date, entry.time);
  const editorId = useId();
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.note);
  const [baseNote, setBaseNote] = useState(entry.note);
  const [error, setError] = useState("");
  const editorCapability = scheduleEntryEditorCapability(editing, Boolean(onSaveNote));
  const displayedError = editorCapability === "read_only"
    ? SCHEDULE_ENTRY_READ_ONLY_MESSAGE
    : error;

  function startEditing() {
    setDraft(entry.note);
    setBaseNote(entry.note);
    setError("");
    setEditing(true);
  }

  function closeEditor() {
    setEditing(false);
    window.requestAnimationFrame(() => editButtonRef.current?.focus());
  }

  function cancelEditing() {
    setDraft(entry.note);
    setError("");
    closeEditor();
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextNote = draft.trim();

    if (entry.kind === "note" && !nextNote) {
      setError("文字註記內容不可空白。");
      return;
    }
    if (!onSaveNote) {
      setError(SCHEDULE_ENTRY_READ_ONLY_MESSAGE);
      return;
    }
    if (entry.note !== baseNote) {
      setError("這筆註記已在另一個分頁更新，請取消後重新編輯。");
      return;
    }
    if (nextNote === entry.note) {
      setError("");
      closeEditor();
      return;
    }

    const saveError = await onSaveNote(entry, nextNote);
    if (saveError) {
      setError(saveError);
      return;
    }

    setError("");
    closeEditor();
  }

  return (
    <article className={`agenda-entry ${entry.kind}`}>
      <div className="entry-when">
        {showDate ? (
          <span className="entry-date">
            <strong>{formatMvpDate(entry.date)}</strong>
            <small>{entry.date}</small>
          </span>
        ) : null}
        <time dateTime={dateTime}>{entry.time}</time>
      </div>
      <div className="entry-type">
        <span>{entry.kind === "booking" ? "預約" : "註記"}</span>
      </div>
      <div className="entry-content">
        <div className="entry-heading">
          <strong>{entry.kind === "booking" ? entry.customerName ?? "已匿名化預約" : entry.title}</strong>
          <small>{staffLabel}</small>
        </div>
        {entry.kind === "booking" && entry.phone ? <span>{entry.phone}</span> : null}
        {editing ? (
          <form className="entry-note-editor" onSubmit={saveNote}>
            <label htmlFor={editorId}>
              {entry.kind === "booking" ? "預約備註" : "註記內容"}
            </label>
            <textarea
              id={editorId}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              required={entry.kind === "note"}
              aria-invalid={displayedError ? true : undefined}
              aria-describedby={displayedError ? `${editorId}-error` : undefined}
              autoFocus
              disabled={editorCapability === "read_only"}
            />
            {displayedError ? (
              <p id={`${editorId}-error`} className="entry-note-error" role="alert">
                {displayedError}
              </p>
            ) : null}
            <div className="entry-note-actions">
              <button
                className="button button-secondary button-small"
                type="button"
                onClick={cancelEditing}
              >
                取消
              </button>
              <button
                className="button button-small"
                type="submit"
                disabled={editorCapability === "read_only"}
              >
                儲存註記
              </button>
            </div>
          </form>
        ) : (
          <div className="entry-note-display">
            <p>{entry.note || "無備註"}</p>
            {onSaveNote ? (
              <button
                ref={editButtonRef}
                className="entry-edit-button"
                type="button"
                onClick={startEditing}
                aria-label={`編輯${entry.kind === "booking" ? "預約備註" : "文字註記內容"}`}
              >
                編輯註記
              </button>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
