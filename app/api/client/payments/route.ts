import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payments = await db.membershipPayment.findMany({
    where: {
      membership: {
        userId: session.user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      stripePaymentId: true,
      membership: {
        select: {
          membershipId: true,
          tier: true,
          status: true,
          createdAt: true,
          expiresAt: true,
        },
      },
    },
  });

  return Response.json({ payments });
}
