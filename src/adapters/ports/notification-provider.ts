import type { Booking, Customer } from "../../domain";

export interface NotificationReceipt {
  messageId: string;
  mode: "mock";
}

export interface NotificationProvider {
  sendBookingConfirmation(booking: Booking, customer: Customer): Promise<NotificationReceipt>;
}
