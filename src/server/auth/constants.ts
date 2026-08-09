export const BETTER_AUTH_PINNED_VERSION = "1.6.26";

export const STAFF_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const STAFF_AUTH_BODY_LIMIT_BYTES = 8 * 1_024;
export const STAFF_LOGIN_WINDOW_MS = 15 * 60 * 1_000;
export const STAFF_LOGIN_BLOCK_MS = 15 * 60 * 1_000;
export const STAFF_LOGIN_MAX_FAILURES = 5;
export const STAFF_RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1_000;

export const PRODUCTION_STAFF_SESSION_COOKIE = "__Host-dum-staff-session";
export const STAGING_STAFF_SESSION_COOKIE = "__Host-dum-staging-staff-session";

export const STAFF_AUTH_BASE_PATH = "/api/auth";

export const STAFF_AUTH_ALLOWED_ROUTES = {
  signIn: `${STAFF_AUTH_BASE_PATH}/sign-in/username`,
  session: `${STAFF_AUTH_BASE_PATH}/get-session`,
  signOut: `${STAFF_AUTH_BASE_PATH}/sign-out`,
} as const;
