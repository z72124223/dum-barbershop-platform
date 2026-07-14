import {
  DomainError,
  overlaps,
  type AuditEvent,
  type Booking,
  type CalendarBlock,
  type Customer,
  type DepositPaymentPlaceholder,
  type EntityId,
  type MembershipPlaceholder,
} from "../../domain";
import {
  mockBookings,
  mockCalendarBlocks,
  mockCustomers,
  mockMemberships,
} from "../../data/mock";
import type {
  AuditRepository,
  BookingRepository,
  CalendarProvider,
  CreateBookingInput,
  CustomerRepository,
  MembershipProvider,
  NotificationProvider,
  NotificationReceipt,
  PaymentProvider,
} from "../ports";

const clone = <T>(value: T): T => structuredClone(value);
const nonBlockingStatuses = new Set<Booking["status"]>([
  "cancelled_by_customer",
  "cancelled_by_shop",
  "no_show",
  "rescheduled",
  "waitlisted",
]);

export class MockBookingRepository implements BookingRepository {
  private records: Booking[];
  private readonly idempotency = new Map<string, EntityId>();

  constructor(seed: Booking[] = []) {
    this.records = clone(seed);
  }

  async list(): Promise<Booking[]> {
    return clone(this.records);
  }

  async findById(id: EntityId): Promise<Booking | null> {
    return clone(this.records.find((booking) => booking.id === id) ?? null);
  }

  async create(input: CreateBookingInput): Promise<Booking> {
    const existingId = this.idempotency.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.records.find((booking) => booking.id === existingId);
      if (existing) return clone(existing);
    }

    this.assertNoSameStaffOverlap(input.booking);
    this.records.push(clone(input.booking));
    this.idempotency.set(input.idempotencyKey, input.booking.id);
    return clone(input.booking);
  }

  async save(booking: Booking): Promise<Booking> {
    const index = this.records.findIndex((item) => item.id === booking.id);
    if (index < 0) {
      throw new DomainError("BOOKING_NOT_FOUND", `Booking ${booking.id} does not exist.`);
    }
    this.assertNoSameStaffOverlap(booking);
    this.records[index] = clone(booking);
    return clone(booking);
  }

  private assertNoSameStaffOverlap(candidate: Booking): void {
    if (nonBlockingStatuses.has(candidate.status)) return;
    const conflict = this.records.some((existing) => {
      if (existing.id === candidate.id || existing.staffId !== candidate.staffId) return false;
      if (nonBlockingStatuses.has(existing.status)) return false;
      return overlaps(
        new Date(candidate.startsAt),
        new Date(candidate.endsAt),
        new Date(existing.startsAt),
        new Date(existing.endsAt),
      );
    });
    if (conflict) {
      throw new DomainError(
        "BOOKING_CONFLICT",
        `Staff ${candidate.staffId} already has an overlapping booking.`,
      );
    }
  }
}

export class MockCustomerRepository implements CustomerRepository {
  private records: Customer[];

  constructor(seed: Customer[] = []) {
    this.records = clone(seed);
  }

  async list(): Promise<Customer[]> {
    return clone(this.records);
  }

  async findById(id: EntityId): Promise<Customer | null> {
    return clone(this.records.find((customer) => customer.id === id) ?? null);
  }

  async search(query: string): Promise<Customer[]> {
    const normalized = query.trim().toLocaleLowerCase("en");
    if (!normalized) return [];
    return clone(
      this.records.filter((customer) =>
        `${customer.name} ${customer.phoneMasked}`.toLocaleLowerCase("en").includes(normalized),
      ),
    );
  }

  async save(customer: Customer): Promise<Customer> {
    const index = this.records.findIndex((item) => item.id === customer.id);
    if (index < 0) this.records.push(clone(customer));
    else this.records[index] = clone(customer);
    return clone(customer);
  }
}

export class MockCalendarProvider implements CalendarProvider {
  private records: CalendarBlock[];

  constructor(seed: CalendarBlock[] = []) {
    this.records = clone(seed);
  }

  async listBlocks(staffId?: EntityId): Promise<CalendarBlock[]> {
    return clone(this.records.filter((block) => !staffId || block.staffId === staffId));
  }

  async createBlock(block: CalendarBlock): Promise<CalendarBlock> {
    this.records.push(clone(block));
    return clone(block);
  }
}

export class MockNotificationProvider implements NotificationProvider {
  async sendBookingConfirmation(booking: Booking, customer: Customer): Promise<NotificationReceipt> {
    return {
      messageId: `mock-confirmation-${booking.id}-${customer.id}`,
      mode: "mock",
    };
  }
}

export class MockPaymentProvider implements PaymentProvider {
  private records: DepositPaymentPlaceholder[] = [];

  async findDepositByBookingId(bookingId: EntityId): Promise<DepositPaymentPlaceholder | null> {
    return clone(this.records.find((deposit) => deposit.bookingId === bookingId) ?? null);
  }

  async saveDeposit(deposit: DepositPaymentPlaceholder): Promise<DepositPaymentPlaceholder> {
    const index = this.records.findIndex((item) => item.id === deposit.id);
    if (index < 0) this.records.push(clone(deposit));
    else this.records[index] = clone(deposit);
    return clone(deposit);
  }
}

export class MockMembershipProvider implements MembershipProvider {
  constructor(private readonly records: MembershipPlaceholder[] = []) {}

  async findByCustomerId(customerId: EntityId): Promise<MembershipPlaceholder | null> {
    return clone(this.records.find((membership) => membership.customerId === customerId) ?? null);
  }
}

export class MockAuditRepository implements AuditRepository {
  private records: AuditEvent[] = [];

  async list(): Promise<AuditEvent[]> {
    return clone(this.records);
  }

  async append(event: AuditEvent): Promise<AuditEvent> {
    this.records.push(clone(event));
    return clone(event);
  }
}

export function createMockPlatform() {
  return {
    bookings: new MockBookingRepository(mockBookings),
    customers: new MockCustomerRepository(mockCustomers),
    calendar: new MockCalendarProvider(mockCalendarBlocks),
    notifications: new MockNotificationProvider(),
    payments: new MockPaymentProvider(),
    memberships: new MockMembershipProvider(mockMemberships),
    audit: new MockAuditRepository(),
  };
}
