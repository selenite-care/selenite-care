import { handleUnsuccessfulOrderCallback } from "../unsuccessful";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleUnsuccessfulOrderCallback(request, "cancelled");
}
