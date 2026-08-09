import {
  getFormalAuthRuntime,
  handleStaffAuthRequest,
} from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authRoute(request: Request): Promise<Response> {
  try {
    return await handleStaffAuthRequest(request, getFormalAuthRuntime());
  } catch {
    return Response.json(
      {
        error: "service_unavailable",
        message: "Authentication is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}

export const GET = authRoute;
export const POST = authRoute;
