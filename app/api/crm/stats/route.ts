import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const [totalClients, totalBookings, pendingBookings, recentBookings] =
    await Promise.all([
      db.user.count({
        where: {
          role: "CLIENT",
        },
      }),
      db.booking.count(),
      db.booking.count({
        where: {
          status: {
            notIn: ["COMPLETED", "CANCELLED"],
          },
        },
      }),
      db.booking.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          token: true,
          appointmentTime: true,
          status: true,
          user: {
            select: {
              name: true,
            },
          },
          doctor: {
            select: {
              name: true,
            },
          },
          service: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

  return Response.json({
    totalClients,
    totalBookings,
    pendingBookings,
    recentBookings,
  });
}
