import { handleUnsuccessfulMembershipCallback } from "../unsuccessful";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleUnsuccessfulMembershipCallback(request, "failed");
}
