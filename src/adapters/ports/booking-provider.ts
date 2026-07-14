import type { Booking, EntityId } from "../../domain";

export interface ProviderBookingReceipt {
  providerReference: string;
  mode: "mock" | "disabled";
  status: "accepted" | "disabled";
}

export interface BookingProvider {
  createBooking(booking: Booking, idempotencyKey: string): Promise<ProviderBookingReceipt>;
  cancelBooking(bookingId: EntityId, idempotencyKey: string): Promise<ProviderBookingReceipt>;
  rescheduleBooking(
    originalBookingId: EntityId,
    replacement: Booking,
    idempotencyKey: string,
  ): Promise<ProviderBookingReceipt>;
}
