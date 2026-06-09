import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const adminError = await requireAdmin();

  if (adminError) {
    return adminError;
  }

  const memberships = await db.membership.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          stripePaymentId: true,
          createdAt: true,
        },
      },
    },
  });

  return Response.json({ memberships });
}
