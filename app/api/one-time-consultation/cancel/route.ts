import { handleUnsuccessfulConsultationCallback } from "../unsuccessful";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleUnsuccessfulConsultationCallback(request, "cancelled");
}
