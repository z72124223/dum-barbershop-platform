import type { EntityId, IntegrationOperation } from "../../domain";

export interface IntegrationQueue {
  list(): Promise<IntegrationOperation[]>;
  findById(id: EntityId): Promise<IntegrationOperation | null>;
  enqueue(operation: IntegrationOperation): Promise<IntegrationOperation>;
  save(operation: IntegrationOperation): Promise<IntegrationOperation>;
}
