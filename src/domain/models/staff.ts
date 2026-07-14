import type { EntityId, LocalTime } from "./common";

export type StaffRole = "owner" | "manager" | "barber" | "reception" | "read_only";

export interface ScheduleInterval {
  start: LocalTime;
  end: LocalTime;
}

export interface StaffScheduleDay {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  intervals: ScheduleInterval[];
}

export interface StaffSchedule {
  timeZone: "Asia/Taipei";
  slotStepMinutes: number;
  days: StaffScheduleDay[];
}

export interface Staff {
  id: EntityId;
  branchId: EntityId;
  displayName: string;
  title: string;
  role: StaffRole;
  specialties: string[];
  serviceIds: EntityId[];
  schedule: StaffSchedule;
  active: boolean;
}
