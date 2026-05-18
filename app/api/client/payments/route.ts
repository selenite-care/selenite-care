import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payments = await db.payment.findMany({
    where: {
      booking: {
        userId: session.user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      booking: {
        select: {
          id: true,
          service: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return Response.json({ payments });
}
