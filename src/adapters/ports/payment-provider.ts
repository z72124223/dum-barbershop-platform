import type { DepositPaymentPlaceholder, EntityId } from "../../domain";

export interface PaymentProvider {
  findDepositByBookingId(bookingId: EntityId): Promise<DepositPaymentPlaceholder | null>;
  saveDeposit(deposit: DepositPaymentPlaceholder): Promise<DepositPaymentPlaceholder>;
}
