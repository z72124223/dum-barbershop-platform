import type { EntityId, IsoInstant } from "./common";

export interface CustomerHistoryEntry {
  id: EntityId;
  bookingId: EntityId;
  occurredAt: IsoInstant;
  serviceLabel: string;
  staffLabel: string;
  summary: string;
}

export interface CustomerTechnicalNote {
  id: EntityId;
  createdAt: IsoInstant;
  authorLabel: string;
  content: string;
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
  preferences?: string[];
  technicalNotes?: CustomerTechnicalNote[];
  history: CustomerHistoryEntry[];
}
