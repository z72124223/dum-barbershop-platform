import {
  getScheduleServerRuntime,
  handleStaffScheduleRequest,
} from "@/server/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    return await handleStaffScheduleRequest(
      request,
      getScheduleServerRuntime(),
      "anonymize_booking",
    );
  } catch {
    return Response.json(
      { error: "service_unavailable", message: "個資作業暫時無法使用。" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
