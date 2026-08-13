export interface ScheduleStaffDto {
  id: string;
  label: string;
  role?: "owner" | "staff";
}

export interface PublicAvailabilitySlotDto {
  staffId: string;
  date: string;
  time: string;
  available: boolean;
}

export interface PublicAvailabilityDto {
  timezone: "Asia/Taipei";
  dates: string[];
  staff: ScheduleStaffDto[];
  slots: PublicAvailabilitySlotDto[];
}

export interface PublicBookingResultDto {
  booking: {
    id: string;
    staffId: string;
    date: string;
    time: string;
    durationMinutes: 60;
    status: "confirmed";
    version: number;
  };
  replayed: boolean;
}

export interface StaffScheduleEntryDto {
  id: string;
  kind: "booking" | "note";
  staffId: string;
  date: string;
  time: string;
  customerName: string | null;
  phone: string | null;
  title: string | null;
  note: string;
  source: "customer" | "staff";
  version: number;
  anonymized: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffScheduleDto {
  timezone: "Asia/Taipei";
  staff: ScheduleStaffDto[];
  entries: StaffScheduleEntryDto[];
}

export interface SafeScheduleHttpError {
  error:
    | "invalid_request"
    | "entry_read_only"
    | "forbidden"
    | "unauthenticated"
    | "not_found"
    | "slot_unavailable"
    | "idempotency_conflict"
    | "version_conflict"
    | "temporarily_unavailable"
    | "service_unavailable";
  message: string;
  retryable?: boolean;
}
