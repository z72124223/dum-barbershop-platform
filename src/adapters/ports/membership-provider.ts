import type { EntityId, MembershipPlaceholder } from "../../domain";

export interface MembershipProvider {
  findByCustomerId(customerId: EntityId): Promise<MembershipPlaceholder | null>;
}
