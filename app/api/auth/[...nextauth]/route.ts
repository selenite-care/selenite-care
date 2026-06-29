import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { getAuthConfig } from "@/lib/auth";

function withNoCacheHeaders(response: Response) {
  const nextResponse = new Response(response.body, response);

  nextResponse.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  nextResponse.headers.set("Pragma", "no-cache");
  nextResponse.headers.set("Expires", "0");

  return nextResponse;
}

export async function GET(request: NextRequest) {
  const { handlers } = NextAuth(await getAuthConfig(request));
  const response = await handlers.GET(request);
  return withNoCacheHeaders(response);
}

export async function POST(request: NextRequest) {
  const { handlers } = NextAuth(await getAuthConfig(request));
  const response = await handlers.POST(request);
  return withNoCacheHeaders(response);
}
