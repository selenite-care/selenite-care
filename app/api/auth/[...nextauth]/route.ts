import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { getAuthConfig } from "@/lib/auth";

function withNoCacheHeaders(response: Response) {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
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
