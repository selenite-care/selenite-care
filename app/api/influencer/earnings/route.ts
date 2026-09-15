import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "INFLUENCER") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const influencer = await db.influencer.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      totalEarned: true,
      totalPaid: true,
      payments: {
        orderBy: {
          paidAt: "desc",
        },
        select: {
          id: true,
          amount: true,
          method: true,
          note: true,
          paidBy: true,
          paidAt: true,
        },
      },
      referrals: {
        where: {
          status: "PENDING",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          commissionAmount: true,
          createdAt: true,
          client: {
            select: {
              name: true,
            },
          },
          membership: {
            select: {
              tier: true,
            },
          },
        },
      },
    },
  });

  if (!influencer) {
    return Response.json(
      { error: "Influencer profile not found." },
      { status: 404 },
    );
  }

  return Response.json({
    totalEarned: influencer.totalEarned,
    totalPaid: influencer.totalPaid,
    pendingBalance: Math.max(0, influencer.totalEarned - influencer.totalPaid),
    payments: influencer.payments,
    pendingReferrals: influencer.referrals,
  });
}
