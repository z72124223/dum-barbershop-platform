import type { IntegrationMode, IntegrationOperation } from "../../domain";

export type IntegrationHealth = "healthy" | "attention" | "idle" | "disabled";

export function integrationHealth(
  mode: IntegrationMode,
  operations: readonly IntegrationOperation[],
): IntegrationHealth {
  if (mode === "disabled") return "disabled";
  if (operations.some((operation) => ["retry_scheduled", "conflict", "timed_out", "partial_failure"].includes(operation.status))) return "attention";
  if (operations.some((operation) => operation.status === "succeeded")) return "healthy";
  return "idle";
}

export function pendingIntegrationCount(operations: readonly IntegrationOperation[]): number {
  return operations.filter((operation) => ["queued", "running", "retry_scheduled"].includes(operation.status)).length;
}
