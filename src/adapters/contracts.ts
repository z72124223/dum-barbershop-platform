import type { Booking, CalendarBlock, Customer, MembershipPlaceholder } from "@/domain/models";

export interface BookingProviderAdapter {
  listBookings(): Promise<Booking[]>;
  createBooking(input: Booking): Promise<Booking>;
  updateBooking(input: Booking): Promise<Booking>;
}

export interface CalendarAdapter {
  listBlocks(staffId?: string): Promise<CalendarBlock[]>;
  createBlock(input: CalendarBlock): Promise<CalendarBlock>;
}

export interface NotificationAdapter {
  sendBookingConfirmation(booking: Booking, customer: Customer): Promise<{ mockMessageId: string }>;
}

export interface MembershipAdapter {
  findByCustomerId(customerId: string): Promise<MembershipPlaceholder | null>;
}
