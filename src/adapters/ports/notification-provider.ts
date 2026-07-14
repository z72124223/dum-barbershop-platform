import type { Booking, Customer } from "../../domain";

export interface NotificationReceipt {
  messageId: string;
  mode: "mock" | "disabled";
}

export type NotificationTemplate =
  | "booking_confirmation"
  | "booking_reminder"
  | "review_request"
  | "return_campaign";

export interface NotificationProvider {
  sendBookingConfirmation(booking: Booking, customer: Customer): Promise<NotificationReceipt>;
  previewTemplate(
    template: NotificationTemplate,
    booking?: Booking,
    customer?: Customer,
  ): Promise<NotificationReceipt>;
}
