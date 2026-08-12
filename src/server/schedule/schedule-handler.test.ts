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
