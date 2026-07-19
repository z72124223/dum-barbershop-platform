import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError, type Booking } from "../../domain";
import {
  MockBookingProvider,
  MockBookingRepository,
  MockCustomerRepository,
  MockIdentityProvider,
  MockIntegrationQueue,
} from "./platform";
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
    const results = await repository.search("二號示範客人");
    assert.equal(results.length, 1);
    assert.ok(results[0]?.phoneMasked.includes("••"));
  });
});

describe("provider-neutral Mock adapters", () => {
  it("keeps the production booking provider explicitly disabled", async () => {
    const provider = new MockBookingProvider();
    const receipt = await provider.createBooking(candidate(), "preview-create");
    assert.equal(receipt.mode, "disabled");
    assert.equal(receipt.status, "disabled");
  });

  it("authenticates and restores only valid local demo sessions", async () => {
    const identity = new MockIdentityProvider();
    const denied = await identity.signIn({ accountId: "barber.demo", accessCode: "wrong" }, "2026-07-18T02:00:00.000Z");
    assert.deepEqual(denied, { ok: false, reason: "invalid_credentials" });

    const signedIn = await identity.signIn({ accountId: "barber.demo", accessCode: "DUM-DEMO" }, "2026-07-18T02:00:00.000Z");
    assert.equal(signedIn.ok, true);
    if (!signedIn.ok) return;
    assert.equal(signedIn.session.authenticated, true);
    assert.equal(signedIn.session.identity.staffId, "staff-mock-bravo");
    assert.ok(signedIn.session.permissions.includes("customer:read_assigned"));
    assert.ok(await identity.restoreSession(signedIn.session, "2026-07-18T03:00:00.000Z"));
    assert.equal(
      await identity.restoreSession(
        { ...signedIn.session, identity: { ...signedIn.session.identity, staffId: "staff-mock-alpha" } },
        "2026-07-18T03:00:00.000Z",
      ),
      null,
    );
    assert.equal(await identity.restoreSession(signedIn.session, signedIn.session.expiresAt), null);
  });

  it("deduplicates queued work by idempotency key", async () => {
    const queue = new MockIntegrationQueue();
    const operation = {
      id: "integration-test-one",
      provider: "calendar" as const,
      mode: "mock" as const,
      action: "upsert_event",
      idempotencyKey: "calendar-booking-one-r1",
      attempt: 1,
      maxAttempts: 2,
      status: "queued" as const,
      createdAt: "2026-07-14T02:00:00.000Z",
      updatedAt: "2026-07-14T02:00:00.000Z",
    };
    await queue.enqueue(operation);
    const duplicate = await queue.enqueue({ ...operation, id: "integration-test-two" });
    assert.equal(duplicate.id, "integration-test-one");
    assert.equal((await queue.list()).length, 1);
  });
});
