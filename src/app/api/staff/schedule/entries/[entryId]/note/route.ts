import {
  getScheduleServerRuntime,
  handleStaffScheduleRequest,
} from "@/server/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
): Promise<Response> {
  try {
    const { entryId } = await context.params;
    return await handleStaffScheduleRequest(
      request,
      getScheduleServerRuntime(),
      "update_note",
      entryId,
    );
  } catch {
    return Response.json(
      { error: "service_unavailable", message: "員工時段服務暫時無法使用。" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
