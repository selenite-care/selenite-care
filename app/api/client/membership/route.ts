import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

const membershipSelect = {
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
} as const;

const incompleteEpsCheckoutFilter = {
  status: "PENDING",
  payment: {
    is: {
      epsMerchantTxnId: {
        not: null,
      },
    },
  },
} as const;

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const membership = await db.membership.findFirst({
    where: {
      userId: session.user.id,
      NOT: incompleteEpsCheckoutFilter,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: membershipSelect,
  });

  if (
    membership &&
    membership.status === "ACTIVE" &&
    membership.expiresAt &&
    membership.expiresAt.getTime() < Date.now()
  ) {
    const updatedMembership = await db.membership.update({
      where: {
        id: membership.id,
      },
      data: {
        status: "EXPIRED",
      },
      select: membershipSelect,
    });

    return Response.json({ membership: updatedMembership });
  }

  return Response.json({ membership });
}
