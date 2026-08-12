import {
  PRODUCTION_STAFF_SESSION_COOKIE,
  STAGING_STAFF_SESSION_COOKIE,
} from "./constants";

export type StaffAuthDeployment = "production" | "staging";

export interface StaffAuthEnvironment {
  deployment: StaffAuthDeployment;
  baseURL: string;
  origin: string;
  expectedHost: string;
  cookieName: string;
  databasePath: string;
  secret: string;
}

export class StaffAuthConfigurationError extends Error {
  readonly name = "StaffAuthConfigurationError";

  constructor() {
    super("Formal staff authentication is not configured safely.");
  }
}

function parseExactHttpsOrigin(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || url.pathname !== "/"
      || url.search
      || url.hash
      || url.origin !== value
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function readStaffAuthEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): StaffAuthEnvironment {
  const production = parseExactHttpsOrigin(environment.DUM_PUBLIC_BASE_URL);
  const staging = parseExactHttpsOrigin(environment.DUM_STAGING_BASE_URL);
  const databasePath = environment.DUM_DATABASE_PATH?.trim();
  const secret = environment.BETTER_AUTH_SECRET;

  if (
    Boolean(production) === Boolean(staging)
    || !databasePath
    || !secret
    || secret.length < 32
  ) {
    throw new StaffAuthConfigurationError();
  }

  const selected = production ?? staging;
  if (!selected) throw new StaffAuthConfigurationError();

  return {
    deployment: production ? "production" : "staging",
    baseURL: selected.origin,
    origin: selected.origin,
    expectedHost: selected.host,
    cookieName: production
      ? PRODUCTION_STAFF_SESSION_COOKIE
      : STAGING_STAFF_SESSION_COOKIE,
    databasePath,
    secret,
  };
}
