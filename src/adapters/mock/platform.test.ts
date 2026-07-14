import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError, type Booking } from "../../domain";
import { MockBookingRepository, MockCustomerRepository } from "./platform";
import { mockBookings, mockCustomers } from "../../data/mock";

function candidate(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-created-test",
    branchId: "branch-mock-taipei",
    staffId: "staff-mock-alpha",
    serviceId: "service-mock-cut",
    customerId: "customer-mock-one",
    startsAt: "2026-07-14T03:30:00.000Z",
    endsAt: "2026-07-14T04:30:00.000Z",
    status: "confirmed",
    depositStatus: "not_required",
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
    source: "mock_customer",
    ...overrides,
  };
}

describe("MockBookingRepository", () => {
  it("rejects same-staff overlap", async () => {
    const repository = new MockBookingRepository(mockBookings);
    await assert.rejects(
      repository.create({ booking: candidate(), idempotencyKey: "conflict-test" }),
      DomainError,
    );
  });

  it("allows different staff at the same time", async () => {
    const repository = new MockBookingRepository(mockBookings);
    const created = await repository.create({
      booking: candidate({ staffId: "staff-mock-charlie" }),
      idempotencyKey: "parallel-staff-test",
    });
    assert.equal(created.staffId, "staff-mock-charlie");
  });

  it("returns the original record for repeated idempotency keys", async () => {
    const repository = new MockBookingRepository([]);
    const first = await repository.create({ booking: candidate(), idempotencyKey: "same-request" });
    const second = await repository.create({
      booking: candidate({ id: "booking-duplicate-attempt" }),
      idempotencyKey: "same-request",
    });
    assert.equal(second.id, first.id);
    assert.equal((await repository.list()).length, 1);
  });
});

describe("MockCustomerRepository", () => {
  it("searches only fictional local fixtures", async () => {
    const repository = new MockCustomerRepository(mockCustomers);
    const results = await repository.search("Mock Customer Two");
    assert.equal(results.length, 1);
    assert.ok(results[0]?.phoneMasked.includes("••"));
  });
});
