import type {
  CreateBookingCommand,
  CreateManualNoteCommand,
  CreateStaffBookingCommand,
  PublicAvailabilityDto,
  PublicBookingResultDto,
  StaffScheduleDto,
  StoredScheduleEntry,
  UpdateScheduleEntryNoteCommand,
} from "@/domain/schedule";
import type { ScheduleServerRuntime } from "./runtime";

function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function toStaffEntry(entry: StoredScheduleEntry): StaffScheduleDto["entries"][number] {
  return {
    id: entry.id,
    kind: entry.kind,
    staffId: entry.staffMemberId,
    date: entry.slotDate,
    time: minutesToTime(entry.slotTimeMinutes),
    customerName: entry.customerName,
    phone: entry.customerPhone,
    title: entry.title,
    note: entry.note,
    source: entry.source,
    version: entry.version,
    anonymized: entry.anonymizedAtUtc !== null,
    createdAt: entry.createdAtUtc,
    updatedAt: entry.updatedAtUtc,
  };
}

export async function readPublicAvailability(
  runtime: ScheduleServerRuntime,
): Promise<PublicAvailabilityDto> {
  const slots = await runtime.repository.listAvailability();
  const staff = new Map<string, string>();
  const dates = new Set<string>();
  for (const slot of slots) {
    staff.set(slot.staffMemberId, slot.staffLabel);
    dates.add(slot.slotDate);
  }
  return {
    timezone: "Asia/Taipei",
    dates: [...dates].sort(),
    staff: [...staff].map(([id, label]) => ({ id, label })),
    slots: slots.map((slot) => ({
      staffId: slot.staffMemberId,
      date: slot.slotDate,
      time: slot.slotTime,
      available: slot.available,
    })),
  };
}

export async function createPublicBooking(
  runtime: ScheduleServerRuntime,
  command: CreateBookingCommand,
): Promise<PublicBookingResultDto> {
  const result = await runtime.repository.createCustomerBooking(command);
  return {
    booking: {
      id: result.entryId,
      staffId: command.staffMemberId.trim(),
      date: command.slotDate.trim(),
      time: command.slotTime.trim(),
      durationMinutes: 60,
      status: "confirmed",
      version: result.version,
    },
    replayed: result.replayed,
  };
}

export async function readStaffSchedule(
  runtime: ScheduleServerRuntime,
  query: { fromDate?: string; toDate?: string },
): Promise<StaffScheduleDto> {
  const [staff, entries] = await Promise.all([
    runtime.repository.listStaffMembers(),
    runtime.repository.listEntries(query),
  ]);
  return {
    timezone: "Asia/Taipei",
    staff: staff.filter((member) => member.active).map((member) => ({
      id: member.id,
      label: member.publicLabel,
      role: member.role,
    })),
    entries: entries.map(toStaffEntry),
  };
}

export async function createStaffBooking(
  runtime: ScheduleServerRuntime,
  command: CreateStaffBookingCommand,
) {
  return runtime.repository.createStaffBooking(command);
}

export async function createStaffNote(
  runtime: ScheduleServerRuntime,
  command: CreateManualNoteCommand,
) {
  return runtime.repository.createManualNote(command);
}

export async function updateStaffEntryNote(
  runtime: ScheduleServerRuntime,
  command: UpdateScheduleEntryNoteCommand,
) {
  return toStaffEntry(await runtime.repository.updateNote(command));
}
