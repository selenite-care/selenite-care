import { NextResponse } from "next/server";

const COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
];

export async function POST() {
  const response = NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );

  for (const cookieName of COOKIE_NAMES) {
    response.cookies.set({
      name: cookieName,
      value: "",
      maxAge: 0,
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: cookieName.startsWith("__Secure-") || cookieName.startsWith("__Host-"),
    });
  }

  return response;
}
