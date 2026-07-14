import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { IntegrationOperation } from "../models";
import { completeIntegrationOperation, retryIntegrationOperation } from "./operations";

function operation(overrides: Partial<IntegrationOperation> = {}): IntegrationOperation {
  return {
    id: "integration-calendar-test",
    provider: "calendar",
    mode: "mock",
    action: "upsert_event",
    entityId: "booking-mock-alpha-1100",
    idempotencyKey: "calendar-booking-mock-alpha-1100-r1",
    attempt: 1,
    maxAttempts: 2,
    status: "queued",
    createdAt: "2026-07-14T02:00:00.000Z",
    updatedAt: "2026-07-14T02:00:00.000Z",
    ...overrides,
  };
}

describe("integration operations", () => {
  it("records success without exposing a real provider", () => {
    const result = completeIntegrationOperation(operation(), "success", "2026-07-14T02:01:00.000Z");
    assert.equal(result.status, "succeeded");
    assert.equal(result.mode, "mock");
  });

  it("schedules and advances a bounded retry after a timeout", () => {
    const scheduled = completeIntegrationOperation(operation(), "timeout", "2026-07-14T02:01:00.000Z");
    assert.equal(scheduled.status, "retry_scheduled");
    const retried = retryIntegrationOperation(scheduled, "2026-07-14T02:02:00.000Z");
    assert.equal(retried.status, "queued");
    assert.equal(retried.attempt, 2);
  });

  it("stops retrying after the configured maximum", () => {
    const result = completeIntegrationOperation(
      operation({ attempt: 2 }),
      "partial_failure",
      "2026-07-14T02:01:00.000Z",
    );
    assert.equal(result.status, "partial_failure");
  });
});
