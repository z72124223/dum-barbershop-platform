import { NextResponse, type NextRequest } from "next/server";
import {
  PRODUCTION_STAFF_SESSION_COOKIE,
  STAGING_STAFF_SESSION_COOKIE,
} from "./server/auth/constants";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/staff/login") return NextResponse.next();

  const hasFormalSession = Boolean(
    request.cookies.get(PRODUCTION_STAFF_SESSION_COOKIE)?.value
    || request.cookies.get(STAGING_STAFF_SESSION_COOKIE)?.value,
  );
  if (!hasFormalSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/staff/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*"],
};
