import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return NextResponse.redirect(
    new URL("/skin-analysis?purchase_failed=true&reason=failed", request.url),
  );
}
