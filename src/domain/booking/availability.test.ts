import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateAvailability, type AvailabilityContext } from "./availability";
import type { AvailabilityRequest, Booking, CalendarBlock, Service, Staff } from "../models";
import { mockBranch, mockServices, mockStaff } from "../../data/mock";

const request: AvailabilityRequest = {
  branchId: mockBranch.id,
  staffId: "staff-mock-alpha",
  serviceId: "service-mock-cut",
  date: "2026-07-14",
};

function context(overrides: Partial<AvailabilityContext> = {}): AvailabilityContext {
  return {
    branches: [mockBranch],
    staff: mockStaff,
    services: mockServices,
    bookings: [],
    blocks: [],
    ...overrides,
  };
}

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-test",
    branchId: mockBranch.id,
    staffId: "staff-mock-alpha",
    serviceId: "service-mock-cut",
    customerId: "customer-test",
    startsAt: "2026-07-14T03:00:00.000Z",
    endsAt: "2026-07-14T04:00:00.000Z",
    status: "confirmed",
    depositStatus: "not_required",
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
    source: "mock_seed",
    ...overrides,
  };
}

describe("calculateAvailability", () => {
  it("returns stepped slots inside the staff schedule", () => {
    const result = calculateAvailability(request, context());
    assert.equal(result.timeZone, "Asia/Taipei");
    assert.equal(result.slots[0]?.label, "10:00");
    assert.ok(result.slots.some((slot) => slot.label === "11:30"));
  });

  it("removes overlapping slots for the same staff member", () => {
    const result = calculateAvailability(request, context({ bookings: [booking()] }));
    const labels = result.slots.map((slot) => slot.label);
    assert.ok(!labels.includes("10:30"));
    assert.ok(!labels.includes("11:00"));
    assert.ok(!labels.includes("11:30"));
  });

  it("allows different staff members to be booked at the same time", () => {
    const result = calculateAvailability(
      request,
      context({ bookings: [booking({ staffId: "staff-mock-bravo" })] }),
    );
    assert.ok(result.slots.some((slot) => slot.label === "11:00"));
  });

  it("removes slots that collide with a staff calendar block", () => {
    const block: CalendarBlock = {
      id: "block-test",
      branchId: mockBranch.id,
      staffId: "staff-mock-alpha",
      startsAt: "2026-07-14T02:00:00.000Z",
      endsAt: "2026-07-14T03:00:00.000Z",
      kind: "blocked",
      reason: "Mock block",
      source: "mock_seed",
    };
    const result = calculateAvailability(request, context({ blocks: [block] }));
    assert.ok(!result.slots.map((slot) => slot.label).includes("10:00"));
  });

  it("returns a clear empty reason outside scheduled days", () => {
    const result = calculateAvailability(
      { ...request, date: "2026-07-13" },
      context(),
    );
    assert.deepEqual(result.slots, []);
    assert.equal(result.emptyReason, "staff_not_scheduled");
  });

  it("does not fit a long service across separate schedule intervals", () => {
    const longService: Service = {
      ...mockServices[0]!,
      id: "service-long",
      durationMinutes: 90,
      bufferAfterMinutes: 0,
    };
    const splitStaff: Staff = {
      ...mockStaff[0]!,
      serviceIds: [longService.id],
      schedule: {
        timeZone: "Asia/Taipei",
        slotStepMinutes: 30,
        days: [
          {
            dayOfWeek: 2,
            intervals: [
              { start: "10:00", end: "11:00" },
              { start: "12:00", end: "13:00" },
            ],
          },
        ],
      },
    };
    const result = calculateAvailability(
      { ...request, serviceId: longService.id },
      context({ staff: [splitStaff], services: [longService] }),
    );
    assert.deepEqual(result.slots, []);
    assert.equal(result.emptyReason, "fully_booked");
  });

  it("reports unsupported staff-service combinations without inventing assignment rules", () => {
    const result = calculateAvailability(
      { ...request, staffId: "staff-mock-charlie", serviceId: "service-mock-texture" },
      context(),
    );
    assert.deepEqual(result.slots, []);
    assert.equal(result.emptyReason, "service_not_supported");
  });
});
