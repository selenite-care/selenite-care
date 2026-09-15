import { getReferralDiscount, validateReferralCode } from "@/lib/referralCode";
import { MEMBERSHIP_PRICES } from "@/lib/membershipDiscounts";

export const runtime = "nodejs";

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Influencer";
}

function getTierPriceMaps(discountPercent: number) {
  const originalPrice: Record<string, number> = {};
  const discountedPrice: Record<string, number> = {};

  for (const [tier, price] of Object.entries(MEMBERSHIP_PRICES)) {
    originalPrice[tier] = price.price;
    discountedPrice[tier] = Math.max(
        0,
      Math.round(price.price * (1 - discountPercent / 100)),
      );
  }

  return {
    originalPrice,
    discountedPrice,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = validateReferralCode(searchParams.get("code") ?? "");

  if (!code) {
    return Response.json(
      { error: "Invalid referral code" },
      { status: 400 },
    );
  }

  const discount = await getReferralDiscount(code);

  if (!discount) {
    return Response.json(
      { error: "Invalid referral code" },
      { status: 404 },
    );
  }

  const prices = getTierPriceMaps(discount.discountPercent);

  return Response.json({
    valid: true,
    influencerName: getFirstName(discount.influencerName),
    discountPercent: discount.discountPercent,
    originalPrice: prices.originalPrice,
    discountedPrice: prices.discountedPrice,
  });
}
