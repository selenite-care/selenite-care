import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const membership = await db.membership.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      membershipId: true,
      tier: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      payment: {
        select: {
          id: true,
          stripePaymentId: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  return Response.json({ membership });
}
