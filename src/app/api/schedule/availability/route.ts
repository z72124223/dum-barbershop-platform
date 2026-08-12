import {
  getScheduleServerRuntime,
  handlePublicAvailabilityRequest,
} from "@/server/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    return await handlePublicAvailabilityRequest(
      request,
      getScheduleServerRuntime(),
    );
  } catch {
    return Response.json(
      { error: "service_unavailable", message: "時段服務暫時無法使用。" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
