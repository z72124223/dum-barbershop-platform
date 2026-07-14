import {
  calculateAvailability,
  type AvailabilityContext,
  type AvailabilityEmptyReason,
  type AvailabilitySlot,
  type EntityId,
  type IsoDate,
} from "../../domain";

export const ANY_STAFF = "any" as const;
export type StaffChoice = EntityId | typeof ANY_STAFF;

export interface BookingSlotOption extends AvailabilitySlot {
  staffId: EntityId;
}
export interface BookingOptionsResult {
  slots: BookingSlotOption[];
  emptyReason?: AvailabilityEmptyReason;
}

export function calculateBookingOptions(
  input: {
    branchId: EntityId;
    serviceId: EntityId;
    staffChoice: StaffChoice;
    date: IsoDate;
  },
  context: AvailabilityContext,
): BookingOptionsResult {
  const candidates = context.staff.filter((staff) =>
    staff.active &&
    staff.branchId === input.branchId &&
    (input.staffChoice === ANY_STAFF ? staff.serviceIds.includes(input.serviceId) : staff.id === input.staffChoice),
  );

  if (candidates.length === 0) {
    return { slots: [], emptyReason: "service_not_supported" };
  }

  const results = candidates.map((staff) => ({
    staff,
    result: calculateAvailability(
      {
        branchId: input.branchId,
        serviceId: input.serviceId,
        staffId: staff.id,
        date: input.date,
      },
      context,
    ),
  }));

  const sorted = results
    .flatMap(({ staff, result }) => result.slots.map((slot) => ({ ...slot, staffId: staff.id })))
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt) || left.staffId.localeCompare(right.staffId));

  if (input.staffChoice !== ANY_STAFF) {
    return {
      slots: sorted,
      ...(sorted.length === 0 ? { emptyReason: results[0]?.result.emptyReason ?? "fully_booked" } : {}),
    };
  }

  const earliestByTime = new Map<string, BookingSlotOption>();
  for (const slot of sorted) {
    if (!earliestByTime.has(slot.startsAt)) earliestByTime.set(slot.startsAt, slot);
  }
  const slots = [...earliestByTime.values()];

  return {
    slots,
    ...(slots.length === 0
      ? { emptyReason: results.every(({ result }) => result.emptyReason === "staff_not_scheduled") ? "staff_not_scheduled" : "fully_booked" }
      : {}),
  };
}
