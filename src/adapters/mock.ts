import type { BookingProviderAdapter, CalendarAdapter, MembershipAdapter, NotificationAdapter } from "./contracts";
import type { Booking, CalendarBlock, Customer, MembershipPlaceholder } from "@/domain/models";

export class MockBookingProviderAdapter implements BookingProviderAdapter {
  constructor(private records: Booking[] = []) {}
  async listBookings() { return [...this.records]; }
  async createBooking(input: Booking) { this.records = [...this.records, input]; return input; }
  async updateBooking(input: Booking) { this.records = this.records.map((item) => item.id === input.id ? input : item); return input; }
}

export class MockCalendarAdapter implements CalendarAdapter {
  constructor(private records: CalendarBlock[] = []) {}
  async listBlocks(staffId?: string) { return this.records.filter((item) => !staffId || item.staffId === staffId); }
  async createBlock(input: CalendarBlock) { this.records = [...this.records, input]; return input; }
}

export class MockNotificationAdapter implements NotificationAdapter {
  async sendBookingConfirmation(booking: Booking, customer: Customer) {
    void booking;
    void customer;
    return { mockMessageId: `mock-notification-${Date.now()}` };
  }
}

export class MockMembershipAdapter implements MembershipAdapter {
  constructor(private records: MembershipPlaceholder[] = []) {}
  async findByCustomerId(customerId: string) { return this.records.find((item) => item.customerId === customerId) ?? null; }
}
