import {
  getScheduleServerRuntime,
  handlePublicBookingRequest,
} from "@/server/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    return await handlePublicBookingRequest(request, getScheduleServerRuntime());
  } catch {
    return Response.json(
      { error: "service_unavailable", message: "預約服務暫時無法使用。" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
