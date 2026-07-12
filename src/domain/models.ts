export type EntityId = string;

export interface Branch {
  id: EntityId;
  name: string;
  timezone: "Asia/Taipei";
  address: string;
  phone: string;
}

export type StaffRole = "owner" | "manager" | "barber" | "reception" | "read_only";

export interface StaffMember {
  id: EntityId;
  branchIds: EntityId[];
  displayName: string;
  role: StaffRole;
  title: string;
  specialties: string[];
  serviceIds: EntityId[];
  active: boolean;
}

export interface Service {
  id: EntityId;
  name: string;
  category: "cut" | "shave" | "perm" | "color" | "care" | "combo";
  description: string;
  durationMinutes: number;
  priceLabel: string;
  active: boolean;
}

export interface Customer {
  id: EntityId;
  name: string;
  phoneMasked: string;
  email?: string;
  preferredStaffId?: EntityId;
  lastVisitAt?: string;
  notes?: string[];
}

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
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  depositStatus: DepositStatus;
  note?: string;
}

export interface PaymentDeposit {
  id: EntityId;
  bookingId: EntityId;
  status: DepositStatus;
  amount?: number;
  currency: "TWD";
  providerReference?: string;
}

export interface MembershipPlaceholder {
  id: EntityId;
  customerId: EntityId;
  externalMemberId?: string;
  level?: string;
  balance?: number;
  remainingVisits?: number;
  points?: number;
  joinedAt?: string;
  expiresAt?: string;
  status: "placeholder" | "inactive" | "active";
}

export interface CalendarBlock {
  id: EntityId;
  branchId: EntityId;
  staffId: EntityId;
  startsAt: string;
  endsAt: string;
  reason: string;
  source: "mock_staff_action" | "mock_calendar";
}

export interface AuditEvent {
  id: EntityId;
  occurredAt: string;
  actorId: EntityId;
  action: "booking_created" | "booking_status_changed" | "calendar_block_created";
  entityType: "booking" | "calendar_block";
  entityId: EntityId;
  metadata: Record<string, string>;
}
