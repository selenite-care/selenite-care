export type ReferralDiscount = {
  valid: boolean;
  influencerId: string;
  influencerName: string;
  discountPercent: number;
};

export function generateReferralCode(name: string): string {
  const nameParts = name
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z]/g, "").toUpperCase())
    .filter(Boolean);

  const firstName =
    nameParts.find((part) => part.length > 2) ?? nameParts[0] ?? "";

  return `${firstName}10`;
}

export function validateReferralCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function getReferralDiscount(
  code: string,
): Promise<ReferralDiscount | null> {
  const { default: db } = await import("@/lib/db");
  const referralCode = validateReferralCode(code);

  if (!referralCode) {
    return null;
  }

  const influencer = await db.influencer.findFirst({
    where: {
      referralCode,
      isActive: true,
    },
    select: {
      id: true,
      commissionRate: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!influencer) {
    return null;
  }

  return {
    valid: true,
    influencerId: influencer.id,
    influencerName: influencer.user.name ?? "",
    discountPercent: influencer.commissionRate,
  };
}
