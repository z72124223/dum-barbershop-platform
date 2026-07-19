import { NextResponse, type NextRequest } from "next/server";
import {
  STAFF_SESSION_COOKIE_NAME,
  isStaffSessionActive,
  parseStaffIdentitySession,
} from "./domain/identity/session";

function readMockStaffSession(request: NextRequest) {
  const raw = request.cookies.get(STAFF_SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const session = parseStaffIdentitySession(JSON.parse(decodeURIComponent(raw)));
    if (!session || !isStaffSessionActive(session, new Date().toISOString())) return null;
    return session;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/staff/login") return NextResponse.next();

  const session = readMockStaffSession(request);
  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/staff/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/staff/integrations") && !session.permissions.includes("integration:read")) {
    const fallbackUrl = request.nextUrl.clone();
    fallbackUrl.pathname = "/staff";
    fallbackUrl.search = "";
    fallbackUrl.searchParams.set("notice", "integration-denied");
    return NextResponse.redirect(fallbackUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*"],
};
