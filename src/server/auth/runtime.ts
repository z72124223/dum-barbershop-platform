import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import {
  applyScheduleMigrations,
  openControlledSqliteConnection,
  type ControlledSqliteConnection,
} from "../../adapters/sqlite";
import {
  STAFF_AUTH_BASE_PATH,
  STAFF_SESSION_TTL_SECONDS,
} from "./constants";
import {
  readStaffAuthEnvironment,
  type StaffAuthEnvironment,
} from "./environment";
import { StaffLoginRateLimiter } from "./rate-limit";

const DISABLED_BETTER_AUTH_PATHS = [
  "/sign-up/email",
  "/sign-in/email",
  "/is-username-available",
  "/update-user",
  "/delete-user",
  "/change-email",
  "/change-password",
  "/set-password",
  "/request-password-reset",
  "/reset-password",
  "/verify-password",
  "/list-sessions",
  "/revoke-session",
  "/revoke-sessions",
  "/revoke-other-sessions",
] as const;

export function createBetterAuthInstance(
  database: ControlledSqliteConnection,
  environment: StaffAuthEnvironment,
) {
  return betterAuth({
    appName: "DUM BARBERSHOP Staff",
    database,
    baseURL: environment.baseURL,
    basePath: STAFF_AUTH_BASE_PATH,
    secret: environment.secret,
    trustedOrigins: [environment.origin],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: STAFF_SESSION_TTL_SECONDS,
      updateAge: 0,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    rateLimit: { enabled: false },
    advanced: {
      database: { generateId: "uuid" },
      useSecureCookies: false,
      crossSubDomainCookies: { enabled: false },
      defaultCookieAttributes: {
        secure: true,
        httpOnly: true,
        sameSite: "strict",
        path: "/",
      },
      cookies: {
        session_token: {
          name: environment.cookieName,
          attributes: {
            secure: true,
            httpOnly: true,
            sameSite: "strict",
            path: "/",
          },
        },
      },
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
      trustedProxyHeaders: false,
      disableCSRFCheck: false,
      disableOriginCheck: false,
    },
    plugins: [username()],
    disabledPaths: [...DISABLED_BETTER_AUTH_PATHS],
    telemetry: { enabled: false },
    logger: { disabled: true },
  });
}

export interface FormalAuthRuntime {
  database: ControlledSqliteConnection;
  environment: StaffAuthEnvironment;
  auth: ReturnType<typeof createBetterAuthInstance>;
  rateLimiter: StaffLoginRateLimiter;
  close(): void;
}

export function openFormalAuthRuntime(
  environment: StaffAuthEnvironment,
): FormalAuthRuntime {
  const database = openControlledSqliteConnection(environment.databasePath);
  try {
    applyScheduleMigrations(database);
    return createFormalAuthRuntime(database, environment, true);
  } catch (error) {
    database.close();
    throw error;
  }
}

export function createFormalAuthRuntime(
  database: ControlledSqliteConnection,
  environment: StaffAuthEnvironment,
  ownsConnection = false,
): FormalAuthRuntime {
  return {
    database,
    environment,
    auth: createBetterAuthInstance(database, environment),
    rateLimiter: new StaffLoginRateLimiter(database, environment.secret),
    close: () => {
      if (ownsConnection) database.close();
    },
  };
}

let runtime: FormalAuthRuntime | undefined;

export function getFormalAuthRuntime(): FormalAuthRuntime {
  if (!runtime) runtime = openFormalAuthRuntime(readStaffAuthEnvironment());
  return runtime;
}
