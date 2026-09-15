import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const influencers = await db.influencer.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      referralCode: true,
      commissionRate: true,
      totalEarned: true,
      totalPaid: true,
      isActive: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      _count: {
        select: {
          referrals: true,
        },
      },
    },
  });

  return Response.json({ influencers });
}
