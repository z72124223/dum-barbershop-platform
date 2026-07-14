import type { EntityId, IsoInstant } from "./common";

export interface CustomerHistoryEntry {
  id: EntityId;
  bookingId: EntityId;
  occurredAt: IsoInstant;
  serviceLabel: string;
  staffLabel: string;
  summary: string;
}

export interface Customer {
  id: EntityId;
  name: string;
  phoneMasked: string;
  email?: string;
  preferredStaffId?: EntityId;
  createdAt: IsoInstant;
  lastVisitAt?: IsoInstant;
  notes: string[];
  history: CustomerHistoryEntry[];
}
