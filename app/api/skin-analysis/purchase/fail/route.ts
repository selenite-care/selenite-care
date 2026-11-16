import { handleUnsuccessfulSkinCreditCallback } from "../unsuccessful";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleUnsuccessfulSkinCreditCallback(request, "failed");
}
