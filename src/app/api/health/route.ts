import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** A deliberately small endpoint for the tunnel and a human smoke check. */
export function GET() {
  return NextResponse.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
