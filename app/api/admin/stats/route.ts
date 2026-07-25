import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const [
    totalUsers,
    totalBookings,
    pendingBookings,
    revenue,
    totalMemberships,
    activeMemberships,
  ] = await db.$transaction([
    db.user.count(),
    db.booking.count(),
    db.booking.count({
      where: {
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
    }),
    db.payment.aggregate({
      _sum: {
        amount: true,
      },
    }),
    db.membership.count(),
    db.membership.count({
      where: {
        status: "ACTIVE",
      },
    }),
  ]);

  return Response.json({
    totalUsers,
    totalBookings,
    totalRevenue: revenue._sum.amount ?? 0,
    pendingBookings,
    totalMemberships,
    activeMemberships,
  });
}
