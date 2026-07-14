import {
  DomainError,
  type IntegrationOperation,
  type IntegrationOperationStatus,
  type IsoInstant,
} from "../models";

export type MockIntegrationOutcome = "success" | "conflict" | "timeout" | "partial_failure";

const RETRYABLE_OUTCOMES = new Set<MockIntegrationOutcome>(["timeout", "partial_failure"]);

export function completeIntegrationOperation(
  operation: IntegrationOperation,
  outcome: MockIntegrationOutcome,
  occurredAt: IsoInstant,
): IntegrationOperation {
  if (operation.status !== "queued" && operation.status !== "running") {
    throw new DomainError(
      "INVALID_INTEGRATION_OPERATION",
      `Integration operation ${operation.id} cannot complete from ${operation.status}.`,
    );
  }

  let status: IntegrationOperationStatus;
  if (outcome === "success") status = "succeeded";
  else if (outcome === "conflict") status = "conflict";
  else if (RETRYABLE_OUTCOMES.has(outcome) && operation.attempt < operation.maxAttempts) status = "retry_scheduled";
  else status = outcome === "timeout" ? "timed_out" : "partial_failure";

  return {
    ...operation,
    status,
    updatedAt: occurredAt,
    errorCode: outcome === "success" ? undefined : `MOCK_${outcome.toUpperCase()}`,
  };
}

export function retryIntegrationOperation(
  operation: IntegrationOperation,
  occurredAt: IsoInstant,
): IntegrationOperation {
  if (operation.status !== "retry_scheduled" || operation.attempt >= operation.maxAttempts) {
    throw new DomainError(
      "INVALID_INTEGRATION_OPERATION",
      `Integration operation ${operation.id} is not eligible for retry.`,
    );
  }
  return {
    ...operation,
    attempt: operation.attempt + 1,
    status: "queued",
    updatedAt: occurredAt,
    errorCode: undefined,
  };
}
