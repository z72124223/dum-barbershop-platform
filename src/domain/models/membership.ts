import type { EntityId, IsoInstant } from "./common";

export interface MembershipPlaceholder {
  id: EntityId;
  customerId: EntityId;
  externalMemberId?: string;
  membershipLevel?: string;
  balance?: number;
  remainingVisits?: number;
  points?: number;
  joinedAt?: IsoInstant;
  expiresAt?: IsoInstant;
  status: "placeholder" | "inactive" | "active";
}
