import { NextResponse } from "next/server";
import { getReferralDiscount, validateReferralCode } from "@/lib/referralCode";

export const runtime = "nodejs";

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Someone";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { code?: unknown }
    | null;
  const code =
    typeof body?.code === "string" ? validateReferralCode(body.code) : "";

  if (!code) {
    return Response.json({ error: "Invalid referral code." }, { status: 400 });
  }

  const discount = await getReferralDiscount(code);

  if (!discount) {
    return Response.json({ error: "Invalid referral code." }, { status: 404 });
  }

  const influencerFirstName = getFirstName(discount.influencerName);
  const landingUrl = new URL("/landing", request.url);

  landingUrl.searchParams.set("ref", code);
  landingUrl.searchParams.set("invitedBy", influencerFirstName);

  const response = NextResponse.json({
    redirectUrl: `${landingUrl.pathname}${landingUrl.search}`,
  });

  response.cookies.set("sc_ref_code", code, {
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
