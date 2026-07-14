import type { Booking, EntityId } from "../../domain";

export interface CreateBookingInput {
  booking: Booking;
  idempotencyKey: string;
}

export interface BookingRepository {
  list(): Promise<Booking[]>;
  findById(id: EntityId): Promise<Booking | null>;
  create(input: CreateBookingInput): Promise<Booking>;
  save(booking: Booking): Promise<Booking>;
}
