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
      referrals: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          originalAmount: true,
          discountAmount: true,
          clientPaid: true,
          commissionAmount: true,
          status: true,
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
    return Response.json({ error: "Influencer profile not found." }, { status: 404 });
  }

  return Response.json({
    referrals: influencer.referrals,
  });
}
