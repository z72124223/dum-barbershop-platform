import type { AuditEvent } from "../../domain";

export interface AuditRepository {
  list(): Promise<AuditEvent[]>;
  append(event: AuditEvent): Promise<AuditEvent>;
}
