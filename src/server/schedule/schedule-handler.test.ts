import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import {
  applyScheduleMigrations,
  createSqliteScheduleEntryRepository,
  openControlledSqliteConnection,
  provisionApprovedScheduleConfig,
} from "../../adapters/sqlite";
import {
  createFormalAuthRuntime,
  handleStaffAuthRequest,
  provisionStaffAccount,
  type FormalAuthRuntime,
  type StaffAuthEnvironment,
} from "../auth";
import {
  CollectionNoticeConfigurationError,
  readCollectionNoticeConfiguration,
} from "./collection-notice";
import {
  handlePublicAvailabilityRequest,
  handlePublicBookingRequest,
  handleStaffScheduleRequest,
} from "./handler";
import {
  createScheduleServerRuntime,
  initializeScheduleServerRuntime,
  type ScheduleServerRuntime,
} from "./runtime";

const ORIGIN = "https://schedule.example.invalid";
const HOST = "schedule.example.invalid";
const PASSWORD = "Fictional-only-strong-password-35";
const tempDirectories: string[] = [];

after(() => {
  for (const directory of tempDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function environment(databasePath: string): StaffAuthEnvironment {
  return {
    deployment: "staging",
    baseURL: ORIGIN,
    origin: ORIGIN,
    expectedHost: HOST,
    cookieName: "__Host-dum-staging-staff-session",
    databasePath,
    secret: "schedule-handler-test-secret-value-at-least-32-characters",
  };
}

function request(
  route: string,
  options: {
    method?: string;
    body?: unknown;
    cookie?: string;
    origin?: boolean;
  } = {},
): Request {
  const headers = new Headers({
    host: HOST,
    "x-forwarded-proto": "https",
    "cf-connecting-ip": "203.0.113.35",
  });
  if (options.cookie) headers.set("cookie", options.cookie);
  if (options.origin) {
    headers.set("origin", ORIGIN);
    headers.set("sec-fetch-site", "same-origin");
  }
  let body: string | undefined;
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }
  return new Request(`${ORIGIN}${route}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });
}

function rawBodyRequest(
  route: string,
  body: BodyInit | null,
  headers: Record<string, string> = {},
): Request {
  return new Request(`${ORIGIN}${route}`, {
    method: "POST",
    headers: {
      host: HOST,
      "x-forwarded-proto": "https",
      "cf-connecting-ip": "203.0.113.35",
      origin: ORIGIN,
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
      ...headers,
    },
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

function bodyStream(chunks: readonly Uint8Array[]): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      const chunk = chunks[index++];
      if (chunk) controller.enqueue(chunk);
      else controller.close();
    },
  }, { highWaterMark: 0 });
}

function countRepositoryCalls(runtime: ScheduleServerRuntime): () => number {
  const repository = runtime.repository;
  let calls = 0;
  runtime.repository = new Proxy(repository, {
    get(target, property) {
      const value = Reflect.get(target, property, target) as unknown;
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => {
        calls += 1;
        return Reflect.apply(value, target, args);
      };
    },
  });
  return () => calls;
}

async function cookieFor(
  authRuntime: FormalAuthRuntime,
  username: string,
): Promise<string> {
  const response = await handleStaffAuthRequest(
    request("/api/auth/sign-in/username", {
      method: "POST",
      origin: true,
      body: { username, password: PASSWORD },
    }),
    authRuntime,
  );
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie);
  return cookie.split(";", 1)[0];
}

async function harness(options: { clock?: () => Date } = {}): Promise<{
  runtime: ScheduleServerRuntime;
  authRuntime: FormalAuthRuntime;
  ownerCookie: string;
  staffCookie: string;
  auditCount(entryId: string): number;
  close(): void;
}> {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "dum-schedule-http-"));
  tempDirectories.push(directory);
  const databasePath = path.join(directory, "schedule.sqlite");
  const database = openControlledSqliteConnection(databasePath);
  applyScheduleMigrations(database);
  provisionApprovedScheduleConfig(database);
  const authRuntime = createFormalAuthRuntime(database, environment(databasePath));
  await provisionStaffAccount(database, {
    role: "owner",
    username: "fixture.owner",
    password: PASSWORD,
  });
  await provisionStaffAccount(database, {
    role: "staff",
    username: "fixture.staff",
    password: PASSWORD,
  });
  const runtime = createScheduleServerRuntime(authRuntime, {
    deployment: "staging",
    contactHref: "mailto:privacy@example.invalid",
    contactLabel: "privacy@example.invalid",
  });
  if (options.clock) {
    runtime.repository = createSqliteScheduleEntryRepository(database, {
      clock: options.clock,
    });
  }
  const ownerCookie = await cookieFor(authRuntime, "fixture.owner");
  const staffCookie = await cookieFor(authRuntime, "fixture.staff");
  return {
    runtime,
    authRuntime,
    ownerCookie,
    staffCookie,
    auditCount: (entryId: string) => (database.prepare(`
      SELECT count(*) AS value FROM audit_events WHERE resource_id = ?
    `).get(entryId) as { value: number }).value,
    close: () => database.close(),
  };
}

describe("collection notice configuration", () => {
  const staging: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    DUM_STAGING_BASE_URL: ORIGIN,
  };
  const production: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    DUM_PUBLIC_BASE_URL: "https://dumbarbershop.com",
  };

  it("fails closed for missing, blank, bare, placeholder, and deployment-mismatched contacts", () => {
    for (const value of [undefined, "", "abcde", "TBD", "https://dumbarbershop.com/"]) {
      assert.throws(
        () => readCollectionNoticeConfiguration({
          ...staging,
          DUM_CUSTOMER_DATA_CONTACT: value,
        }),
        CollectionNoticeConfigurationError,
      );
    }
    assert.throws(
      () => readCollectionNoticeConfiguration({
        ...production,
        DUM_CUSTOMER_DATA_CONTACT: "mailto:privacy@example.invalid",
      }),
      CollectionNoticeConfigurationError,
    );
    assert.throws(
      () => readCollectionNoticeConfiguration({
        ...production,
        DUM_CUSTOMER_DATA_CONTACT: "https://example.com/",
      }),
      CollectionNoticeConfigurationError,
    );
  });

  it("accepts only strict actionable production URIs and explicit staging fixtures", () => {
    const approvedDomainRoot = "https://dumbarbershop.com/";
    assert.equal(
      readCollectionNoticeConfiguration({
        ...production,
        DUM_CUSTOMER_DATA_CONTACT: approvedDomainRoot,
      }).contactHref,
      approvedDomainRoot,
    );
    assert.equal(
      readCollectionNoticeConfiguration({
        ...staging,
        DUM_CUSTOMER_DATA_CONTACT: "mailto:privacy@example.invalid",
      }).deployment,
      "staging",
    );
  });

  it("fails before opening the auth/database runtime when collection is unavailable", () => {
    let authRuntimeOpened = false;
    assert.throws(
      () => initializeScheduleServerRuntime(
        {
          NODE_ENV: "production",
          DUM_PUBLIC_BASE_URL: "https://dumbarbershop.com",
        },
        () => {
          authRuntimeOpened = true;
          throw new Error("must not open");
        },
      ),
      CollectionNoticeConfigurationError,
    );
    assert.equal(authRuntimeOpened, false);
  });

  it("keeps all eight required notice subjects visible without adding marketing consent", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/features/booking/booking-flow.tsx"),
      "utf8",
    );
    for (const subject of [
      "蒐集者",
      "目的",
      "欄位",
      "期間",
      "地區／處理者",
      "使用方式",
      "權利",
      "不提供的影響",
    ]) {
      assert.equal(source.includes(subject), true, subject);
    }
    assert.equal(source.includes("不作行銷"), true, "no marketing");
    assert.equal(/行銷同意|marketing consent/i.test(source), false);
  });
});

describe("same-site schedule HTTP boundary", () => {
  it("accepts a small no-Content-Length chunked JSON request", async () => {
    const fixture = await harness();
    try {
      const slot = (await fixture.runtime.repository.listAvailability()).find(
        (candidate) => candidate.available,
      );
      assert.ok(slot);
      const bytes = new TextEncoder().encode(JSON.stringify({
        idempotencyKey: "chunked-small-booking",
        staffMemberId: slot.staffMemberId,
        slotDate: slot.slotDate,
        slotTime: slot.slotTime,
        customerName: "Fictional chunked customer",
        customerPhone: "0900-000-901",
        note: "small chunked request",
      }));
      const chunks: Uint8Array[] = [];
      for (let index = 0; index < bytes.byteLength; index += 17) {
        chunks.push(bytes.slice(index, index + 17));
      }
      const chunked = rawBodyRequest(
        "/api/schedule/bookings",
        bodyStream(chunks),
      );
      assert.equal(chunked.headers.get("content-length"), null);
      const response = await handlePublicBookingRequest(chunked, fixture.runtime);
      assert.equal(response.status, 201);
    } finally {
      fixture.close();
    }
  });

  it("bounds and cancels 8193-byte chunked bodies even when Content-Length is absent or false", async () => {
    for (const declaredLength of [undefined, "1"] as const) {
      const fixture = await harness();
      try {
        const repositoryCalls = countRepositoryCalls(fixture.runtime);
        let pulls = 0;
        let producedBytes = 0;
        let cancelled = false;
        const chunks = [
          new Uint8Array(4_096),
          new Uint8Array(4_096),
          new Uint8Array(1),
        ];
        const stream = new ReadableStream<Uint8Array>({
          pull(controller) {
            const chunk = chunks[pulls];
            pulls += 1;
            producedBytes += chunk.byteLength;
            controller.enqueue(chunk);
          },
          cancel() {
            cancelled = true;
          },
        }, { highWaterMark: 0 });
        const response = await handlePublicBookingRequest(
          rawBodyRequest(
            "/api/schedule/bookings",
            stream,
            declaredLength ? { "content-length": declaredLength } : {},
          ),
          fixture.runtime,
        );
        assert.equal(response.status, 400, declaredLength ?? "no content-length");
        assert.equal(cancelled, true);
        assert.equal(pulls, 3);
        assert.equal(producedBytes, 8_193);
        assert.equal(repositoryCalls(), 0);
      } finally {
        fixture.close();
      }
    }
  });

  it("accepts exactly 8192 bytes and rejects invalid UTF-8 through the handler boundary", async () => {
    const exactFixture = await harness();
    try {
      const slot = (await exactFixture.runtime.repository.listAvailability()).find(
        (candidate) => candidate.available,
      );
      assert.ok(slot);
      const body = JSON.stringify({
        idempotencyKey: "exact-body-limit-booking",
        staffMemberId: slot.staffMemberId,
        slotDate: slot.slotDate,
        slotTime: slot.slotTime,
        customerName: "Fictional exact-limit customer",
        customerPhone: "0900-000-902",
        note: "exact body boundary",
      });
      const exactBytes = new TextEncoder().encode(`${body}${" ".repeat(8_192 - body.length)}`);
      assert.equal(exactBytes.byteLength, 8_192);
      const exactRequest = rawBodyRequest(
        "/api/schedule/bookings",
        bodyStream([exactBytes.slice(0, 4_096), exactBytes.slice(4_096)]),
      );
      assert.equal(exactRequest.headers.get("content-length"), null);
      const accepted = await handlePublicBookingRequest(exactRequest, exactFixture.runtime);
      assert.equal(accepted.status, 201);
    } finally {
      exactFixture.close();
    }

    const invalidFixture = await harness();
    try {
      const repositoryCalls = countRepositoryCalls(invalidFixture.runtime);
      const invalidUtf8 = rawBodyRequest(
        "/api/schedule/bookings",
        bodyStream([new Uint8Array([0x7b, 0x22, 0xc3, 0x28, 0x22, 0x7d])]),
      );
      const rejected = await handlePublicBookingRequest(
        invalidUtf8,
        invalidFixture.runtime,
      );
      assert.equal(rejected.status, 400);
      assert.equal(repositoryCalls(), 0);
    } finally {
      invalidFixture.close();
    }
  });

  it("rejects encoded, malformed, null, wrong-type, and declared-oversized bodies before repository access", async () => {
    const fixtures: Array<{
      label: string;
      bytes: Uint8Array;
      headers: Record<string, string>;
      rejectedBeforePull?: boolean;
    }> = [
      { label: "gzip", bytes: new TextEncoder().encode("{}"), headers: { "content-encoding": "gzip" }, rejectedBeforePull: true },
      { label: "identity", bytes: new TextEncoder().encode("{}"), headers: { "content-encoding": "identity" }, rejectedBeforePull: true },
      { label: "br", bytes: new TextEncoder().encode("{}"), headers: { "content-encoding": "br" }, rejectedBeforePull: true },
      { label: "wrong content type", bytes: new TextEncoder().encode("{}"), headers: { "content-type": "text/plain" }, rejectedBeforePull: true },
      { label: "declared oversized", bytes: new TextEncoder().encode("{}"), headers: { "content-length": "8193" }, rejectedBeforePull: true },
      { label: "null", bytes: new TextEncoder().encode("null"), headers: {} },
      { label: "invalid json", bytes: new TextEncoder().encode("{"), headers: {} },
    ];

    for (const candidate of fixtures) {
      const fixture = await harness();
      try {
        const repositoryCalls = countRepositoryCalls(fixture.runtime);
        let pulls = 0;
        const stream = new ReadableStream<Uint8Array>({
          pull(controller) {
            pulls += 1;
            controller.enqueue(candidate.bytes);
            controller.close();
          },
        }, { highWaterMark: 0 });
        const response = await handlePublicBookingRequest(
          rawBodyRequest("/api/schedule/bookings", stream, candidate.headers),
          fixture.runtime,
        );
        assert.equal(response.status, 400, candidate.label);
        assert.equal(repositoryCalls(), 0, candidate.label);
        if (candidate.rejectedBeforePull) {
          assert.equal(pulls, 0, candidate.label);
        }
      } finally {
        fixture.close();
      }
    }

    const missingBodyFixture = await harness();
    try {
      const repositoryCalls = countRepositoryCalls(missingBodyFixture.runtime);
      const response = await handlePublicBookingRequest(
        rawBodyRequest("/api/schedule/bookings", null),
        missingBodyFixture.runtime,
      );
      assert.equal(response.status, 400);
      assert.equal(repositoryCalls(), 0);
    } finally {
      missingBodyFixture.close();
    }
  });

  it("shares public bookings with authenticated staff and returns no public PII", async () => {
    const fixture = await harness();
    try {
      const availabilityResponse = await handlePublicAvailabilityRequest(
        request("/api/schedule/availability"),
        fixture.runtime,
      );
      assert.equal(availabilityResponse.status, 200);
      const availability = await availabilityResponse.json() as {
        staff: Array<{ id: string; label: string }>;
        slots: Array<{ staffId: string; date: string; time: string; available: boolean }>;
      };
      const slot = availability.slots.find((item) => item.available);
      assert.ok(slot);
      const customer = {
        name: "虛構跨裝置顧客",
        phone: "0900-000-935",
        note: "虛構 HTTP 註記",
      };
      const createResponse = await handlePublicBookingRequest(
        request("/api/schedule/bookings", {
          method: "POST",
          origin: true,
          body: {
            idempotencyKey: "http-public-booking",
            staffMemberId: slot.staffId,
            slotDate: slot.date,
            slotTime: slot.time,
            customerName: customer.name,
            customerPhone: customer.phone,
            note: customer.note,
          },
        }),
        fixture.runtime,
      );
      assert.equal(createResponse.status, 201);
      const publicJson = JSON.stringify(await createResponse.json());
      for (const pii of Object.values(customer)) assert.equal(publicJson.includes(pii), false);

      const staffResponse = await handleStaffScheduleRequest(
        request("/api/staff/schedule", { cookie: fixture.staffCookie }),
        fixture.runtime,
        "read",
      );
      assert.equal(staffResponse.status, 200);
      assert.equal(staffResponse.headers.get("cache-control"), "no-store");
      const staffJson = JSON.stringify(await staffResponse.json());
      for (const pii of Object.values(customer)) assert.equal(staffJson.includes(pii), true);

      const availabilityAfter = await handlePublicAvailabilityRequest(
        request("/api/schedule/availability"),
        fixture.runtime,
      );
      const publicAfter = JSON.stringify(await availabilityAfter.json());
      for (const pii of Object.values(customer)) assert.equal(publicAfter.includes(pii), false);
    } finally {
      fixture.close();
    }
  });

  it("replays identical HTTP idempotency requests and rejects changed payloads without PII", async () => {
    const fixture = await harness();
    try {
      const availability = await (await handlePublicAvailabilityRequest(
        request("/api/schedule/availability"),
        fixture.runtime,
      )).json() as { slots: Array<{ staffId: string; date: string; time: string; available: boolean }> };
      const slot = availability.slots.find((item) => item.available);
      assert.ok(slot);
      const body = {
        idempotencyKey: "http-idempotency-replay",
        staffMemberId: slot.staffId,
        slotDate: slot.date,
        slotTime: slot.time,
        customerName: "虛構重送顧客",
        customerPhone: "0900-000-936",
        note: "虛構重送註記",
      };
      const first = await handlePublicBookingRequest(
        request("/api/schedule/bookings", { method: "POST", origin: true, body }),
        fixture.runtime,
      );
      const replay = await handlePublicBookingRequest(
        request("/api/schedule/bookings", { method: "POST", origin: true, body }),
        fixture.runtime,
      );
      assert.equal(first.status, 201);
      assert.equal(replay.status, 201);
      const firstResult = await first.json() as { booking: { id: string }; replayed: boolean };
      const replayResult = await replay.json() as { booking: { id: string }; replayed: boolean };
      assert.equal(firstResult.replayed, false);
      assert.equal(replayResult.replayed, true);
      assert.equal(replayResult.booking.id, firstResult.booking.id);

      const changed = await handlePublicBookingRequest(
        request("/api/schedule/bookings", {
          method: "POST",
          origin: true,
          body: { ...body, customerName: "虛構不同顧客" },
        }),
        fixture.runtime,
      );
      assert.equal(changed.status, 409);
      const safeError = await changed.text();
      for (const pii of [body.customerName, body.customerPhone, body.note, "虛構不同顧客"]) {
        assert.equal(safeError.includes(pii), false);
      }
    } finally {
      fixture.close();
    }
  });

  it("settles two HTTP clients racing for one slot as one success and one conflict", async () => {
    const fixture = await harness();
    try {
      const availability = await (await handlePublicAvailabilityRequest(
        request("/api/schedule/availability"),
        fixture.runtime,
      )).json() as { slots: Array<{ staffId: string; date: string; time: string; available: boolean }> };
      const slot = availability.slots.find((item) => item.available);
      assert.ok(slot);
      const base = {
        staffMemberId: slot.staffId,
        slotDate: slot.date,
        slotTime: slot.time,
        customerPhone: "0900-000-937",
        note: "虛構競爭註記",
      };
      const responses = await Promise.all([
        handlePublicBookingRequest(request("/api/schedule/bookings", {
          method: "POST", origin: true, body: {
            ...base, idempotencyKey: "http-race-a", customerName: "虛構競爭甲",
          },
        }), fixture.runtime),
        handlePublicBookingRequest(request("/api/schedule/bookings", {
          method: "POST", origin: true, body: {
            ...base, idempotencyKey: "http-race-b", customerName: "虛構競爭乙",
          },
        }), fixture.runtime),
      ]);
      assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
      const conflict = responses.find((response) => response.status === 409);
      assert.ok(conflict);
      const serialized = await conflict.text();
      for (const pii of [base.customerPhone, base.note, "虛構競爭甲", "虛構競爭乙"]) {
        assert.equal(serialized.includes(pii), false);
      }
    } finally {
      fixture.close();
    }
  });

  it("rejects elapsed and old Taipei slots on a direct booking request", async () => {
    const fixture = await harness({
      clock: () => new Date("2026-08-09T02:00:00.000Z"),
    });
    try {
      const availability = await (await handlePublicAvailabilityRequest(
        request("/api/schedule/availability"),
        fixture.runtime,
      )).json() as { staff: Array<{ id: string }> };
      const [staff] = availability.staff;
      assert.ok(staff);
      const direct = async (idempotencyKey: string, slotDate: string, slotTime: string) =>
        handlePublicBookingRequest(request("/api/schedule/bookings", {
          method: "POST",
          origin: true,
          body: {
            idempotencyKey,
            staffMemberId: staff.id,
            slotDate,
            slotTime,
            customerName: "虛構過期顧客",
            customerPhone: "0900-000-938",
            note: "虛構直接請求",
          },
        }), fixture.runtime);
      assert.equal((await direct("http-elapsed", "2026-08-09", "10:00")).status, 409);
      assert.equal((await direct("http-old-date", "2026-08-08", "11:00")).status, 409);
      const schedule = await handleStaffScheduleRequest(
        request("/api/staff/schedule", { cookie: fixture.ownerCookie }),
        fixture.runtime,
        "read",
      );
      assert.equal((await schedule.json() as { entries: unknown[] }).entries.length, 0);
    } finally {
      fixture.close();
    }
  });

  it("returns entry_read_only for same-minute and past-date direct PATCH without writes", async () => {
    let now = new Date("2026-08-09T00:00:00.000Z");
    const fixture = await harness({ clock: () => now });
    try {
      const [staff] = await fixture.runtime.repository.listStaffMembers();
      const bookingResponse = await handleStaffScheduleRequest(
        request("/api/staff/schedule/bookings", {
          method: "POST",
          origin: true,
          cookie: fixture.ownerCookie,
          body: {
            idempotencyKey: "http-elapsed-note-booking",
            staffMemberId: staff.id,
            slotDate: "2026-08-09",
            slotTime: "10:00",
            customerName: "Fictional direct PATCH customer",
            customerPhone: "0900-000-939",
            note: "original booking note",
          },
        }),
        fixture.runtime,
        "create_booking",
      );
      assert.equal(bookingResponse.status, 201);
      const bookingId = (await bookingResponse.json() as { entryId: string }).entryId;
      const noteResponse = await handleStaffScheduleRequest(
        request("/api/staff/schedule/notes", {
          method: "POST",
          origin: true,
          cookie: fixture.ownerCookie,
          body: {
            idempotencyKey: "http-past-note",
            staffMemberId: staff.id,
            slotDate: "2026-08-09",
            slotTime: "11:00",
            title: "Past direct PATCH",
            note: "original manual note",
          },
        }),
        fixture.runtime,
        "create_note",
      );
      assert.equal(noteResponse.status, 201);
      const noteId = (await noteResponse.json() as { entryId: string }).entryId;
      assert.equal(fixture.auditCount(bookingId), 1);
      assert.equal(fixture.auditCount(noteId), 1);

      now = new Date("2026-08-09T02:00:00.000Z");
      const sameMinute = await handleStaffScheduleRequest(
        request(`/api/staff/schedule/entries/${bookingId}/note`, {
          method: "PATCH",
          origin: true,
          cookie: fixture.staffCookie,
          body: { expectedVersion: 1, note: "must not replace started note" },
        }),
        fixture.runtime,
        "update_note",
        bookingId,
      );
      assert.equal(sameMinute.status, 409);
      assert.equal((await sameMinute.json() as { error: string }).error, "entry_read_only");

      now = new Date("2026-08-10T00:00:00.000Z");
      for (const attemptedNote of ["must not replace past note", ""]) {
        const oldDate = await handleStaffScheduleRequest(
          request(`/api/staff/schedule/entries/${noteId}/note`, {
            method: "PATCH",
            origin: true,
            cookie: fixture.staffCookie,
            body: { expectedVersion: 1, note: attemptedNote },
          }),
          fixture.runtime,
          "update_note",
          noteId,
        );
        assert.equal(oldDate.status, 409);
        assert.equal((await oldDate.json() as { error: string }).error, "entry_read_only");
      }

      const entries = await fixture.runtime.repository.listEntries();
      const preservedBooking = entries.find((entry) => entry.id === bookingId);
      const preservedNote = entries.find((entry) => entry.id === noteId);
      assert.deepEqual(
        {
          customerName: preservedBooking?.customerName,
          customerPhone: preservedBooking?.customerPhone,
          note: preservedBooking?.note,
          version: preservedBooking?.version,
        },
        {
          customerName: "Fictional direct PATCH customer",
          customerPhone: "0900-000-939",
          note: "original booking note",
          version: 1,
        },
      );
      assert.deepEqual(
        { note: preservedNote?.note, version: preservedNote?.version },
        { note: "original manual note", version: 1 },
      );
      assert.equal(fixture.auditCount(bookingId), 1);
      assert.equal(fixture.auditCount(noteId), 1);
    } finally {
      fixture.close();
    }
  });

  it("re-authenticates every staff read/write operation and keeps errors free of PII", async () => {
    const fixture = await harness();
    try {
      const availability = await (await handlePublicAvailabilityRequest(
        request("/api/schedule/availability"),
        fixture.runtime,
      )).json() as { slots: Array<{ staffId: string; date: string; time: string; available: boolean }> };
      const slots = availability.slots.filter((slot) => slot.available);
      assert.equal(slots.length > 2, true);
      const privateBody = {
        idempotencyKey: "staff-http-booking",
        staffMemberId: slots[0].staffId,
        slotDate: slots[0].date,
        slotTime: slots[0].time,
        customerName: "虛構員工新增顧客",
        customerPhone: "0900-000-945",
        note: "虛構員工私密註記",
      };
      const operations = [
        ["read", request("/api/staff/schedule")],
        ["create_booking", request("/api/staff/schedule/bookings", { method: "POST", origin: true, body: privateBody })],
        ["create_note", request("/api/staff/schedule/notes", { method: "POST", origin: true, body: {
          idempotencyKey: "staff-http-note",
          staffMemberId: slots[1].staffId,
          slotDate: slots[1].date,
          slotTime: slots[1].time,
          title: "虛構標題",
          note: "虛構內容",
        } })],
        ["update_note", request("/api/staff/schedule/entries/missing/note", { method: "PATCH", origin: true, body: { expectedVersion: 1, note: "虛構修改" } })],
        ["issue_anonymization_verification", request("/api/staff/privacy/anonymization-verifications", { method: "POST", origin: true, body: { bookingEntryId: "missing" } })],
        ["anonymize_booking", request("/api/staff/privacy/anonymize", { method: "POST", origin: true, body: { bookingEntryId: "missing", verificationId: "missing", expectedVersion: 1 } })],
      ] as const;
      for (const [operation, unauthenticated] of operations) {
        const response = await handleStaffScheduleRequest(
          unauthenticated,
          fixture.runtime,
          operation,
          operation === "update_note" ? "missing" : undefined,
        );
        assert.equal(response.status, 401, operation);
        const serialized = await response.text();
        for (const value of Object.values(privateBody)) {
          assert.equal(serialized.includes(value), false, operation);
        }
        assert.equal(/SQLITE|SELECT|stack|session/i.test(serialized), false);
      }
    } finally {
      fixture.close();
    }
  });

  it("protects note CAS and owner-verified single-use anonymization through formal sessions", async () => {
    const fixture = await harness();
    try {
      const availability = await (await handlePublicAvailabilityRequest(
        request("/api/schedule/availability"), fixture.runtime,
      )).json() as { slots: Array<{ staffId: string; date: string; time: string; available: boolean }> };
      const slots = availability.slots.filter((slot) => slot.available);
      const bookingSlot = slots[0];
      const noteSlot = slots[1];
      assert.ok(bookingSlot && noteSlot);

      const bookingResponse = await handlePublicBookingRequest(
        request("/api/schedule/bookings", { method: "POST", origin: true, body: {
          idempotencyKey: "privacy-http-booking",
          staffMemberId: bookingSlot.staffId,
          slotDate: bookingSlot.date,
          slotTime: bookingSlot.time,
          customerName: "虛構匿名化顧客",
          customerPhone: "0900-000-955",
          note: "虛構匿名化顧客註記",
        } }),
        fixture.runtime,
      );
      assert.equal(bookingResponse.status, 201);
      const bookingId = (await bookingResponse.json() as { booking: { id: string } }).booking.id;

      const noteResponse = await handleStaffScheduleRequest(
        request("/api/staff/schedule/notes", { method: "POST", origin: true, cookie: fixture.staffCookie, body: {
          idempotencyKey: "privacy-http-note",
          staffMemberId: noteSlot.staffId,
          slotDate: noteSlot.date,
          slotTime: noteSlot.time,
          title: "歷史標題",
          note: "初始內容",
        } }),
        fixture.runtime,
        "create_note",
      );
      assert.equal(noteResponse.status, 201);
      const noteId = (await noteResponse.json() as { entryId: string }).entryId;
      const otherActorSameKey = await handleStaffScheduleRequest(
        request("/api/staff/schedule/notes", { method: "POST", origin: true, cookie: fixture.ownerCookie, body: {
          idempotencyKey: "privacy-http-note",
          staffMemberId: noteSlot.staffId,
          slotDate: noteSlot.date,
          slotTime: noteSlot.time,
          title: "歷史標題",
          note: "初始內容",
        } }),
        fixture.runtime,
        "create_note",
      );
      assert.equal(otherActorSameKey.status, 409);
      const updated = await handleStaffScheduleRequest(
        request(`/api/staff/schedule/entries/${noteId}/note`, { method: "PATCH", origin: true, cookie: fixture.ownerCookie, body: { expectedVersion: 1, note: "最新內容" } }),
        fixture.runtime,
        "update_note",
        noteId,
      );
      assert.equal(updated.status, 200);
      const stale = await handleStaffScheduleRequest(
        request(`/api/staff/schedule/entries/${noteId}/note`, { method: "PATCH", origin: true, cookie: fixture.staffCookie, body: { expectedVersion: 1, note: "過期內容" } }),
        fixture.runtime,
        "update_note",
        noteId,
      );
      assert.equal(stale.status, 409);

      const staffCannotIssue = await handleStaffScheduleRequest(
        request("/api/staff/privacy/anonymization-verifications", { method: "POST", origin: true, cookie: fixture.staffCookie, body: { bookingEntryId: bookingId } }),
        fixture.runtime,
        "issue_anonymization_verification",
      );
      assert.equal(staffCannotIssue.status, 403);
      const issued = await handleStaffScheduleRequest(
        request("/api/staff/privacy/anonymization-verifications", { method: "POST", origin: true, cookie: fixture.ownerCookie, body: { bookingEntryId: bookingId } }),
        fixture.runtime,
        "issue_anonymization_verification",
      );
      assert.equal(issued.status, 201);
      const proof = await issued.json() as { verificationId: string };
      const anonymized = await handleStaffScheduleRequest(
        request("/api/staff/privacy/anonymize", { method: "POST", origin: true, cookie: fixture.staffCookie, body: {
          bookingEntryId: bookingId,
          verificationId: proof.verificationId,
          expectedVersion: 1,
        } }),
        fixture.runtime,
        "anonymize_booking",
      );
      assert.equal(anonymized.status, 200);
      const anonymizedBaseline = (await fixture.runtime.repository.listEntries()).find(
        (entry) => entry.id === bookingId,
      );
      assert.ok(anonymizedBaseline?.anonymizedAtUtc);
      assert.equal(fixture.auditCount(bookingId), 2);
      for (const attemptedNote of ["must not restore anonymized PII", ""]) {
        const rejectedPatch = await handleStaffScheduleRequest(
          request(`/api/staff/schedule/entries/${bookingId}/note`, {
            method: "PATCH",
            origin: true,
            cookie: fixture.staffCookie,
            body: { expectedVersion: 2, note: attemptedNote },
          }),
          fixture.runtime,
          "update_note",
          bookingId,
        );
        assert.equal(rejectedPatch.status, 409);
        const rejectedJson = await rejectedPatch.json() as {
          error: string;
          message: string;
        };
        assert.equal(rejectedJson.error, "entry_read_only");
        for (const pii of ["虛構匿名化顧客", "0900-000-955", "虛構匿名化顧客註記"]) {
          assert.equal(JSON.stringify(rejectedJson).includes(pii), false);
        }
      }
      const protectedBooking = (await fixture.runtime.repository.listEntries()).find(
        (entry) => entry.id === bookingId,
      );
      assert.deepEqual(
        {
          customerName: protectedBooking?.customerName,
          customerPhone: protectedBooking?.customerPhone,
          note: protectedBooking?.note,
          version: protectedBooking?.version,
          anonymizedAtUtc: protectedBooking?.anonymizedAtUtc,
        },
        {
          customerName: null,
          customerPhone: null,
          note: "",
          version: 2,
          anonymizedAtUtc: anonymizedBaseline.anonymizedAtUtc,
        },
      );
      assert.equal(fixture.auditCount(bookingId), 2);
      const replay = await handleStaffScheduleRequest(
        request("/api/staff/privacy/anonymize", { method: "POST", origin: true, cookie: fixture.ownerCookie, body: {
          bookingEntryId: bookingId,
          verificationId: proof.verificationId,
          expectedVersion: 2,
        } }),
        fixture.runtime,
        "anonymize_booking",
      );
      assert.equal(replay.status, 404);

      const history = await handleStaffScheduleRequest(
        request("/api/staff/schedule", { cookie: fixture.ownerCookie }),
        fixture.runtime,
        "read",
      );
      const historyJson = JSON.stringify(await history.json());
      for (const pii of ["虛構匿名化顧客", "0900-000-955", "虛構匿名化顧客註記"]) {
        assert.equal(historyJson.includes(pii), false);
      }
      assert.equal(historyJson.includes("最新內容"), true);
    } finally {
      fixture.close();
    }
  });
});
