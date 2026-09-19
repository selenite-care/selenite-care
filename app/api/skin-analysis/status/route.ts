import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkAnalysisAccess } from "@/lib/imageHash";
import { getSetting } from "@/lib/settings";

export const runtime = "nodejs";

function parsePrice(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 25;
  }

  return parsed;
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [access, membership, priceSetting] = await Promise.all([
    checkAnalysisAccess(session.user.id),
    db.membership.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        expiresAt: "desc",
      },
      select: {
        tier: true,
      },
    }),
    getSetting("skin_analysis_price_bdt"),
  ]);

  return Response.json({
    freeRemaining: access.freeRemaining,
    paidCredits: access.paidCredits,
    membershipTier: membership?.tier ?? null,
    pricePerAnalysis: parsePrice(priceSetting),
  });
}
