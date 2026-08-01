import {
  DomainError,
  STAFF_SESSION_TTL_MS,
  isStaffSessionActive,
  overlaps,
  permissionsForStaffRole,
  type AuditEvent,
  type Booking,
  type CalendarBlock,
  type Customer,
  type DepositPaymentPlaceholder,
  type EntityId,
  type MembershipPlaceholder,
  type IntegrationOperation,
  type IsoInstant,
  type StaffDemoAccount,
  type StaffIdentitySession,
  type StaffSignInInput,
  type StaffSignInResult,
} from "../../domain";
import {
  mockBookings,
  mockCalendarBlocks,
  mockCustomers,
  mockMemberships,
  mockIntegrationOperations,
  mockStaffIdentityAccounts,
} from "../../data/mock";
import type {
  AuditRepository,
  BookingProvider,
  BookingRepository,
  CalendarProvider,
  CreateBookingInput,
  CustomerRepository,
  IdentityProvider,
  IntegrationQueue,
  MembershipProvider,
  NotificationProvider,
  NotificationReceipt,
  PaymentProvider,
  ProviderBookingReceipt,
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

  async previewTemplate(
    template: "booking_confirmation" | "booking_reminder" | "review_request" | "return_campaign",
    booking?: Booking,
    customer?: Customer,
  ): Promise<NotificationReceipt> {
    return {
      messageId: `disabled-${template}-${booking?.id ?? "no-booking"}-${customer?.id ?? "no-customer"}`,
      mode: "disabled",
    };
  }
}

export class MockBookingProvider implements BookingProvider {
  async createBooking(booking: Booking, idempotencyKey: string): Promise<ProviderBookingReceipt> {
    return this.disabledReceipt(`create-${booking.id}-${idempotencyKey}`);
  }

  async cancelBooking(bookingId: EntityId, idempotencyKey: string): Promise<ProviderBookingReceipt> {
    return this.disabledReceipt(`cancel-${bookingId}-${idempotencyKey}`);
  }

  async rescheduleBooking(
    originalBookingId: EntityId,
    replacement: Booking,
    idempotencyKey: string,
  ): Promise<ProviderBookingReceipt> {
    return this.disabledReceipt(`reschedule-${originalBookingId}-${replacement.id}-${idempotencyKey}`);
  }

  private disabledReceipt(reference: string): ProviderBookingReceipt {
    return { providerReference: `disabled-${reference}`, mode: "disabled", status: "disabled" };
  }
}

export class MockIdentityProvider implements IdentityProvider {
  async listDemoAccounts(): Promise<Omit<StaffDemoAccount, "accessCode">[]> {
    return mockStaffIdentityAccounts.map(({ id, accountId, displayName, role, staffId, active }) => ({
      id,
      accountId,
      displayName,
      role,
      ...(staffId ? { staffId } : {}),
      active,
    }));
  }

  async signIn(input: StaffSignInInput, now: IsoInstant = new Date().toISOString()): Promise<StaffSignInResult> {
    const account = mockStaffIdentityAccounts.find((item) => item.accountId === input.accountId);
    if (!account || account.accessCode !== input.accessCode) {
      return { ok: false, reason: "invalid_credentials" };
    }
    if (!account.active) return { ok: false, reason: "account_disabled" };

    const issuedAt = new Date(now);
    const session: StaffIdentitySession = {
      version: 2,
      mode: "mock",
      authenticated: true,
      sessionId: `mock-session-${account.id}-${issuedAt.getTime()}`,
      identity: {
        id: account.id,
        accountId: account.accountId,
        displayName: account.displayName,
        role: account.role,
        ...(account.staffId ? { staffId: account.staffId } : {}),
      },
      permissions: permissionsForStaffRole(account.role),
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + STAFF_SESSION_TTL_MS).toISOString(),
    };
    return { ok: true, session };
  }

  async restoreSession(
    session: StaffIdentitySession,
    now: IsoInstant = new Date().toISOString(),
  ): Promise<StaffIdentitySession | null> {
    if (session.version !== 2 || !isStaffSessionActive(session, now)) return null;
    const account = mockStaffIdentityAccounts.find((item) => item.id === session.identity.id && item.active);
    if (
      !account ||
      account.accountId !== session.identity.accountId ||
      account.role !== session.identity.role ||
      account.staffId !== session.identity.staffId
    ) return null;
    const expectedPermissions = permissionsForStaffRole(account.role);
    if (
      session.permissions.length !== expectedPermissions.length ||
      expectedPermissions.some((permission) => !session.permissions.includes(permission))
    ) return null;
    return {
      ...clone(session),
      identity: { ...session.identity, displayName: account.displayName },
      permissions: expectedPermissions,
    };
  }

  async signOut(sessionId: string): Promise<void> {
    void sessionId;
  }
}

export class MockIntegrationQueue implements IntegrationQueue {
  private records: IntegrationOperation[];
  private readonly idempotency = new Map<string, EntityId>();

  constructor(seed: IntegrationOperation[] = []) {
    this.records = clone(seed);
    seed.forEach((operation) => this.idempotency.set(operation.idempotencyKey, operation.id));
  }

  async list(): Promise<IntegrationOperation[]> {
    return clone(this.records);
  }

  async findById(id: EntityId): Promise<IntegrationOperation | null> {
    return clone(this.records.find((operation) => operation.id === id) ?? null);
  }

  async enqueue(operation: IntegrationOperation): Promise<IntegrationOperation> {
    const existingId = this.idempotency.get(operation.idempotencyKey);
    if (existingId) {
      const existing = this.records.find((record) => record.id === existingId);
      if (existing) return clone(existing);
    }
    this.records.push(clone(operation));
    this.idempotency.set(operation.idempotencyKey, operation.id);
    return clone(operation);
  }

  async save(operation: IntegrationOperation): Promise<IntegrationOperation> {
    const index = this.records.findIndex((record) => record.id === operation.id);
    if (index < 0) this.records.push(clone(operation));
    else this.records[index] = clone(operation);
    this.idempotency.set(operation.idempotencyKey, operation.id);
    return clone(operation);
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
    bookingProvider: new MockBookingProvider(),
    customers: new MockCustomerRepository(mockCustomers),
    identity: new MockIdentityProvider(),
    integrations: new MockIntegrationQueue(mockIntegrationOperations),
    calendar: new MockCalendarProvider(mockCalendarBlocks),
    notifications: new MockNotificationProvider(),
    payments: new MockPaymentProvider(),
    memberships: new MockMembershipProvider(mockMemberships),
    audit: new MockAuditRepository(),
  };
}
