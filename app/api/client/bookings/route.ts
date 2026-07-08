import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const bookings = await db.booking.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          designation: true,
        },
      },
      diagnosis: {
        select: {
          recommendations: {
            select: {
              productId: true,
            },
          },
        },
      },
    },
  });

  return Response.json({ bookings });
}
