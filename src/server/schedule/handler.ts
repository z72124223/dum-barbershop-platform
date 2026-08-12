import {
  ScheduleDataError,
  toSafeScheduleErrorResponse,
  type SafeScheduleHttpError,
} from "@/domain/schedule";
import {
  authorizeStaffCapability,
  resolveStaffActor,
  StaffAuthorizationError,
  type AuthenticatedStaffActor,
} from "@/server/auth";
import {
  createPublicBooking,
  createStaffBooking,
  createStaffNote,
  readPublicAvailability,
  readStaffSchedule,
  updateStaffEntryNote,
} from "./service";
import type { ScheduleServerRuntime } from "./runtime";

const BODY_LIMIT_BYTES = 8 * 1024;
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

type ActorResolver = (
  runtime: ScheduleServerRuntime["authRuntime"],
  headers: Headers,
) => Promise<AuthenticatedStaffActor>;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function errorResponse(
  status: number,
  error: SafeScheduleHttpError["error"],
  message: string,
  retryable?: boolean,
): Response {
  return json(status, { error, message, ...(retryable ? { retryable } : {}) });
}

function validateTransport(
  request: Request,
  runtime: ScheduleServerRuntime,
): Response | null {
  const host = request.headers.get("host");
  if (
    !host
    || host.includes(",")
    || host !== runtime.authRuntime.environment.expectedHost
    || request.headers.get("x-forwarded-proto") !== "https"
  ) {
    return errorResponse(400, "invalid_request", "The request was rejected.");
  }
  return null;
}

function validateMutationOrigin(
  request: Request,
  runtime: ScheduleServerRuntime,
): Response | null {
  if (
    request.headers.get("origin") !== runtime.authRuntime.environment.origin
    || request.headers.get("sec-fetch-site") !== "same-origin"
  ) {
    return errorResponse(403, "forbidden", "The request was rejected.");
  }
  return null;
}

async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  if (request.headers.get("content-type")?.split(";", 1)[0]?.trim() !== "application/json") {
    return null;
  }
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > BODY_LIMIT_BYTES)) {
    return null;
  }
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > BODY_LIMIT_BYTES) return null;
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function exactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => key in value)
    && Object.keys(value).every((key) => allowed.has(key));
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function scheduleFailure(error: unknown): Response {
  if (error instanceof StaffAuthorizationError) {
    return error.status === 401
      ? errorResponse(401, "unauthenticated", "Authentication required.")
      : errorResponse(403, "forbidden", "Access denied.");
  }
  if (error instanceof ScheduleDataError) {
    const safe = toSafeScheduleErrorResponse(error);
    const messages: Record<ScheduleDataError["code"], string> = {
      invalid_request: "提交的時段資料無效。",
      slot_unavailable: "這個時段已被預約，請重新選擇。",
      idempotency_conflict: "這個請求識別碼已用於不同資料。",
      version_conflict: "這筆註記已被其他人更新，請重新載入。",
      not_found: "找不到指定資料。",
      temporarily_unavailable: "時段服務暫時忙碌，請安全重試。",
      storage_failure: "時段服務目前無法完成請求。",
    };
    return errorResponse(
      safe.status,
      error.code === "storage_failure" ? "service_unavailable" : error.code,
      messages[error.code],
      error.retryable,
    );
  }
  return errorResponse(503, "service_unavailable", "時段服務暫時無法使用。");
}

export async function handlePublicAvailabilityRequest(
  request: Request,
  runtime: ScheduleServerRuntime,
): Promise<Response> {
  const transport = validateTransport(request, runtime);
  if (transport) return transport;
  if (request.method !== "GET") return errorResponse(404, "not_found", "Not found.");
  try {
    return json(200, await readPublicAvailability(runtime));
  } catch (error) {
    return scheduleFailure(error);
  }
}

export async function handlePublicBookingRequest(
  request: Request,
  runtime: ScheduleServerRuntime,
): Promise<Response> {
  const transport = validateTransport(request, runtime);
  if (transport) return transport;
  const origin = validateMutationOrigin(request, runtime);
  if (origin) return origin;
  if (request.method !== "POST") return errorResponse(404, "not_found", "Not found.");
  const body = await readJsonObject(request);
  if (
    !body
    || !exactKeys(body, [
      "idempotencyKey", "staffMemberId", "slotDate", "slotTime",
      "customerName", "customerPhone",
    ], ["note"])
  ) {
    return errorResponse(400, "invalid_request", "提交的預約資料無效。");
  }
  const command = {
    idempotencyKey: stringValue(body.idempotencyKey),
    staffMemberId: stringValue(body.staffMemberId),
    slotDate: stringValue(body.slotDate),
    slotTime: stringValue(body.slotTime),
    customerName: stringValue(body.customerName),
    customerPhone: stringValue(body.customerPhone),
    note: body.note === undefined ? "" : stringValue(body.note),
  };
  if (Object.values(command).some((value) => value === null)) {
    return errorResponse(400, "invalid_request", "提交的預約資料無效。");
  }
  try {
    return json(201, await createPublicBooking(runtime, command as {
      idempotencyKey: string;
      staffMemberId: string;
      slotDate: string;
      slotTime: string;
      customerName: string;
      customerPhone: string;
      note: string;
    }));
  } catch (error) {
    return scheduleFailure(error);
  }
}

export type StaffScheduleOperation =
  | "read"
  | "create_booking"
  | "create_note"
  | "update_note"
  | "issue_anonymization_verification"
  | "anonymize_booking";

export async function handleStaffScheduleRequest(
  request: Request,
  runtime: ScheduleServerRuntime,
  operation: StaffScheduleOperation,
  entryId?: string,
  actorResolver: ActorResolver = resolveStaffActor,
): Promise<Response> {
  const transport = validateTransport(request, runtime);
  if (transport) return transport;
  if (request.method !== "GET") {
    const origin = validateMutationOrigin(request, runtime);
    if (origin) return origin;
  }

  try {
    const actor = await actorResolver(runtime.authRuntime, request.headers);
    authorizeStaffCapability(
      actor,
      operation === "read"
        ? "schedule:read"
        : operation === "create_booking"
          ? "booking:write"
          : operation === "issue_anonymization_verification"
            ? "customer-data:verify"
            : operation === "anonymize_booking"
              ? "customer-data:anonymize"
              : "note:write",
    );

    if (operation === "read") {
      if (request.method !== "GET") throw new ScheduleDataError("not_found", 404);
      const url = new URL(request.url);
      const allowed = new Set(["from", "to"]);
      if ([...url.searchParams.keys()].some((key) => !allowed.has(key))) {
        throw new ScheduleDataError("invalid_request", 400);
      }
      return json(200, await readStaffSchedule(runtime, {
        fromDate: url.searchParams.get("from") ?? undefined,
        toDate: url.searchParams.get("to") ?? undefined,
      }));
    }

    if (
      (operation === "update_note" && request.method !== "PATCH")
      || (operation !== "update_note" && request.method !== "POST")
    ) {
      throw new ScheduleDataError("not_found", 404);
    }
    const body = await readJsonObject(request);
    if (!body) throw new ScheduleDataError("invalid_request", 400);

    if (operation === "issue_anonymization_verification") {
      if (!exactKeys(body, ["bookingEntryId"]) || typeof body.bookingEntryId !== "string") {
        throw new ScheduleDataError("invalid_request", 400);
      }
      return json(201, await runtime.repository.issueAnonymizationVerification({
        actorId: actor.staffId,
        bookingEntryId: body.bookingEntryId,
      }));
    }

    if (operation === "anonymize_booking") {
      if (
        !exactKeys(body, ["bookingEntryId", "verificationId", "expectedVersion"])
        || typeof body.bookingEntryId !== "string"
        || typeof body.verificationId !== "string"
        || !Number.isInteger(body.expectedVersion)
      ) throw new ScheduleDataError("invalid_request", 400);
      const entry = await runtime.repository.anonymizeBooking({
        actorId: actor.staffId,
        bookingEntryId: body.bookingEntryId,
        verificationId: body.verificationId,
        expectedVersion: body.expectedVersion as number,
      });
      return json(200, {
        booking: { id: entry.id, version: entry.version, anonymized: true },
      });
    }

    if (operation === "create_booking") {
      if (!exactKeys(body, [
        "idempotencyKey", "staffMemberId", "slotDate", "slotTime",
        "customerName", "customerPhone",
      ], ["note"])) throw new ScheduleDataError("invalid_request", 400);
      const values = [
        body.idempotencyKey, body.staffMemberId, body.slotDate, body.slotTime,
        body.customerName, body.customerPhone,
      ];
      if (values.some((value) => typeof value !== "string")
        || (body.note !== undefined && typeof body.note !== "string")) {
        throw new ScheduleDataError("invalid_request", 400);
      }
      return json(201, await createStaffBooking(runtime, {
        actorId: actor.staffId,
        idempotencyKey: body.idempotencyKey as string,
        staffMemberId: body.staffMemberId as string,
        slotDate: body.slotDate as string,
        slotTime: body.slotTime as string,
        customerName: body.customerName as string,
        customerPhone: body.customerPhone as string,
        note: body.note as string | undefined,
      }));
    }

    if (operation === "create_note") {
      if (!exactKeys(body, [
        "idempotencyKey", "staffMemberId", "slotDate", "slotTime", "title", "note",
      ]) || Object.values(body).some((value) => typeof value !== "string")) {
        throw new ScheduleDataError("invalid_request", 400);
      }
      return json(201, await createStaffNote(runtime, {
        actorId: actor.staffId,
        idempotencyKey: body.idempotencyKey as string,
        staffMemberId: body.staffMemberId as string,
        slotDate: body.slotDate as string,
        slotTime: body.slotTime as string,
        title: body.title as string,
        note: body.note as string,
      }));
    }

    if (
      !entryId
      || !exactKeys(body, ["expectedVersion", "note"])
      || !Number.isInteger(body.expectedVersion)
      || typeof body.note !== "string"
    ) {
      throw new ScheduleDataError("invalid_request", 400);
    }
    return json(200, await updateStaffEntryNote(runtime, {
      actorId: actor.staffId,
      entryId,
      expectedVersion: body.expectedVersion as number,
      note: body.note,
    }));
  } catch (error) {
    return scheduleFailure(error);
  }
}
