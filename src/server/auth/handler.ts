import {
  STAFF_AUTH_ALLOWED_ROUTES,
  STAFF_AUTH_BODY_LIMIT_BYTES,
} from "./constants";
import {
  readBetterAuthSession,
  resolveStaffActor,
  StaffAuthorizationError,
  toPublicStaffSession,
} from "./authorization";
import type { FormalAuthRuntime } from "./runtime";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const GENERIC_LOGIN_ERROR = {
  error: "invalid_credentials",
  message: "帳號或密碼不正確。",
};

function json(status: number, body: unknown, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...Object.fromEntries(new Headers(headers)) },
  });
}

function safeError(status: number, error: string, message: string): Response {
  return json(status, { error, message });
}

function validateTransport(request: Request, runtime: FormalAuthRuntime): Response | null {
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (
    !host
    || host.includes(",")
    || host !== runtime.environment.expectedHost
    || forwardedProto !== "https"
  ) {
    return safeError(400, "invalid_request", "The request was rejected.");
  }
  return null;
}

function validateSameOriginMutation(
  request: Request,
  runtime: FormalAuthRuntime,
): Response | null {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (origin !== runtime.environment.origin || fetchSite !== "same-origin") {
    return safeError(403, "forbidden", "The request was rejected.");
  }
  return null;
}

async function readBoundedBody(request: Request): Promise<Uint8Array | null> {
  const declaredLength = request.headers.get("content-length");
  if (
    declaredLength
    && (!/^\d+$/.test(declaredLength)
      || Number(declaredLength) > STAFF_AUTH_BODY_LIMIT_BYTES)
  ) {
    return null;
  }
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > STAFF_AUTH_BODY_LIMIT_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function parseLoginBody(bytes: Uint8Array): { username: string; password: string } | null {
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (
      Object.keys(record).sort().join(",") !== "password,username"
      || typeof record.username !== "string"
      || typeof record.password !== "string"
    ) {
      return null;
    }
    const username = record.username.trim();
    if (
      username.length < 3
      || username.length > 30
      || !/^[a-zA-Z0-9._]+$/.test(username)
      || record.password.length < 12
      || record.password.length > 128
    ) {
      return null;
    }
    return { username, password: record.password };
  } catch {
    return null;
  }
}

function cookieHeaderFromResponse(response: Response): string | null {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return null;
  const pair = setCookie.split(";", 1)[0]?.trim();
  return pair && pair.includes("=") ? pair : null;
}

function copySessionCookie(source: Response, targetHeaders: Headers): void {
  const setCookie = source.headers.get("set-cookie");
  if (setCookie) targetHeaders.set("set-cookie", setCookie);
}

function authRequestWithBody(request: Request, bytes: Uint8Array): Request {
  const body = Uint8Array.from(bytes).buffer;
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body,
  });
}

function trustedClientIp(request: Request, runtime: FormalAuthRuntime): string | null {
  const header = request.headers.get("cf-connecting-ip");
  if (!header || header.includes(",")) return null;
  return runtime.rateLimiter.normalizeClientIp(header);
}

async function handleSignIn(
  request: Request,
  runtime: FormalAuthRuntime,
): Promise<Response> {
  if (request.headers.get("content-type")?.split(";", 1)[0]?.trim() !== "application/json") {
    return safeError(415, "unsupported_media_type", "JSON is required.");
  }
  const bytes = await readBoundedBody(request);
  if (!bytes) return safeError(413, "request_too_large", "The request is too large.");
  const input = parseLoginBody(bytes);
  const clientIp = trustedClientIp(request, runtime);
  if (!input || !clientIp) {
    return safeError(400, "invalid_request", "The request was rejected.");
  }

  return runtime.rateLimiter.serializeAttempt(input.username, clientIp, async () => {
    const now = new Date();
    const rateState = runtime.rateLimiter.inspect(input.username, clientIp, now);
    if (rateState.blocked) {
      return json(429, {
        error: "too_many_attempts",
        message: "登入嘗試過多，請稍後再試。",
      }, { "retry-after": String(rateState.retryAfterSeconds) });
    }

    const upstream = await runtime.auth.handler(authRequestWithBody(request, bytes));
    const cookie = cookieHeaderFromResponse(upstream);
    if (!upstream.ok || !cookie) {
      runtime.rateLimiter.recordFailure(input.username, clientIp, now);
      return json(401, GENERIC_LOGIN_ERROR);
    }

    const sessionHeaders = new Headers(request.headers);
    sessionHeaders.set("cookie", cookie);
    const betterAuthSession = await readBetterAuthSession(runtime, sessionHeaders);
    try {
      const actor = await resolveStaffActor(runtime, sessionHeaders);
      runtime.rateLimiter.clear(input.username, clientIp);
      const headers = new Headers(JSON_HEADERS);
      copySessionCookie(upstream, headers);
      return json(200, toPublicStaffSession(actor), headers);
    } catch {
      if (betterAuthSession?.user.id) {
        runtime.database.prepare(`DELETE FROM session WHERE userId = ?`).run(
          betterAuthSession.user.id,
        );
      }
      runtime.rateLimiter.recordFailure(input.username, clientIp, now);
      return json(401, GENERIC_LOGIN_ERROR);
    }
  });
}

async function handleGetSession(
  request: Request,
  runtime: FormalAuthRuntime,
): Promise<Response> {
  try {
    const actor = await resolveStaffActor(runtime, request.headers);
    return json(200, toPublicStaffSession(actor));
  } catch (error) {
    const status = error instanceof StaffAuthorizationError ? error.status : 401;
    return safeError(
      status,
      status === 403 ? "forbidden" : "unauthenticated",
      status === 403 ? "Access denied." : "Authentication required.",
    );
  }
}

async function handleSignOut(
  request: Request,
  runtime: FormalAuthRuntime,
): Promise<Response> {
  const bytes = await readBoundedBody(request);
  if (!bytes) return safeError(413, "request_too_large", "The request is too large.");
  const upstream = await runtime.auth.handler(authRequestWithBody(request, bytes));
  const headers = new Headers(JSON_HEADERS);
  copySessionCookie(upstream, headers);
  return json(200, { ok: true }, headers);
}

export async function handleStaffAuthRequest(
  request: Request,
  runtime: FormalAuthRuntime,
): Promise<Response> {
  const url = new URL(request.url);
  const transportFailure = validateTransport(request, runtime);
  if (transportFailure) return transportFailure;

  const routeAndMethod = `${request.method} ${url.pathname}`;
  const allowed = new Set([
    `POST ${STAFF_AUTH_ALLOWED_ROUTES.signIn}`,
    `GET ${STAFF_AUTH_ALLOWED_ROUTES.session}`,
    `POST ${STAFF_AUTH_ALLOWED_ROUTES.signOut}`,
  ]);
  if (!allowed.has(routeAndMethod)) {
    return safeError(404, "not_found", "Not found.");
  }

  if (request.method === "POST") {
    const originFailure = validateSameOriginMutation(request, runtime);
    if (originFailure) return originFailure;
  }

  if (url.pathname === STAFF_AUTH_ALLOWED_ROUTES.signIn) {
    return handleSignIn(request, runtime);
  }
  if (url.pathname === STAFF_AUTH_ALLOWED_ROUTES.session) {
    return handleGetSession(request, runtime);
  }
  return handleSignOut(request, runtime);
}
