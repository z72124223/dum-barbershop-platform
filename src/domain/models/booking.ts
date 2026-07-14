import type { EntityId, IsoInstant } from "./common";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "in_service"
  | "completed"
  | "cancelled_by_customer"
  | "cancelled_by_shop"
  | "no_show"
  | "rescheduled"
  | "waitlisted";

export type DepositStatus =
  | "not_required"
  | "unpaid"
  | "pending"
  | "paid"
  | "refunded"
  | "partially_refunded"
  | "forfeited";

export interface Booking {
  id: EntityId;
  branchId: EntityId;
  staffId: EntityId;
  serviceId: EntityId;
  customerId: EntityId;
  startsAt: IsoInstant;
  endsAt: IsoInstant;
  status: BookingStatus;
  depositStatus: DepositStatus;
  note?: string;
  managementCodeMasked?: string;
  rescheduledFromBookingId?: EntityId;
  rescheduledToBookingId?: EntityId;
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
  source: "mock_customer" | "mock_staff" | "mock_seed";
}

export interface DepositPaymentPlaceholder {
  id: EntityId;
  bookingId: EntityId;
  status: DepositStatus;
  currency: "TWD";
  amount?: number;
  providerReference?: string;
}
