import type { EntityId, IsoDate, IsoInstant } from "./common";

export interface AvailabilityRequest {
  branchId: EntityId;
  staffId: EntityId;
  serviceId: EntityId;
  date: IsoDate;
}

export interface AvailabilitySlot {
  startsAt: IsoInstant;
  endsAt: IsoInstant;
  label: string;
}

export type AvailabilityEmptyReason =
  | "staff_not_scheduled"
  | "fully_booked"
  | "service_not_supported";

export interface AvailabilityResult {
  request: AvailabilityRequest;
  timeZone: "Asia/Taipei";
  slots: AvailabilitySlot[];
  emptyReason?: AvailabilityEmptyReason;
}
