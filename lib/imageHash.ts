import { createHash } from "crypto";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import type { MembershipTier } from "@prisma/client";

type AnalysisAccess = {
  canAnalyzeFree: boolean;
  requiresPayment: boolean;
  freeRemaining: number;
  paidCredits: number;
};

const FREE_LIMIT_SETTING_KEYS: Record<MembershipTier, string> = {
  SIGNATURE: "skin_analysis_free_signature",
  CRYSTAL: "skin_analysis_free_crystal",
  PLATINUM: "skin_analysis_free_platinum",
};

const DEFAULT_FREE_LIMITS: Record<MembershipTier, number> = {
  SIGNATURE: 1,
  CRYSTAL: 2,
  PLATINUM: 3,
};

export async function generateImageHash(buffer: Buffer): Promise<string> {
  return createHash("sha256").update(buffer).digest("hex");
}

function parseFreeLimit(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export async function checkAnalysisAccess(
  userId: string | null,
): Promise<AnalysisAccess> {
  if (!userId) {
    return {
      canAnalyzeFree: false,
      requiresPayment: true,
      freeRemaining: 0,
      paidCredits: 0,
    };
  }

  const now = new Date();
  const [membership, creditRecord, signatureLimit, crystalLimit, platinumLimit] =
    await Promise.all([
      db.membership.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          expiresAt: {
            gt: now,
          },
        },
        orderBy: {
          expiresAt: "desc",
        },
        select: {
          id: true,
          tier: true,
        },
      }),
      db.skinAnalysisCredit.findUnique({
        where: {
          userId,
        },
        select: {
          paidCredits: true,
          freeCreditsUsed: true,
          lastMembershipId: true,
        },
      }),
      getSetting(FREE_LIMIT_SETTING_KEYS.SIGNATURE),
      getSetting(FREE_LIMIT_SETTING_KEYS.CRYSTAL),
      getSetting(FREE_LIMIT_SETTING_KEYS.PLATINUM),
    ]);

  const freeLimits: Record<MembershipTier, number> = {
    SIGNATURE: parseFreeLimit(signatureLimit, DEFAULT_FREE_LIMITS.SIGNATURE),
    CRYSTAL: parseFreeLimit(crystalLimit, DEFAULT_FREE_LIMITS.CRYSTAL),
    PLATINUM: parseFreeLimit(platinumLimit, DEFAULT_FREE_LIMITS.PLATINUM),
  };
  const paidCredits = creditRecord?.paidCredits ?? 0;
  const freeLimit = membership ? freeLimits[membership.tier] : 0;
  const shouldResetFreeCredits =
    Boolean(membership) && membership?.id !== creditRecord?.lastMembershipId;
  const freeRemaining = shouldResetFreeCredits
    ? freeLimit
    : Math.max(0, freeLimit - (creditRecord?.freeCreditsUsed ?? 0));
  const canAnalyzeFree = freeRemaining > 0;

  return {
    canAnalyzeFree,
    requiresPayment: !canAnalyzeFree && paidCredits === 0,
    freeRemaining,
    paidCredits,
  };
}
