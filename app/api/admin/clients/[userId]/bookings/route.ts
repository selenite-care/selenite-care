import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

const allowedRoles = new Set(["ADMIN", "DOCTOR", "CRM"]);

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!allowedRoles.has(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { userId } = await context.params;

  if (!userId) {
    return Response.json({ error: "User ID is required." }, { status: 400 });
  }

  const bookings = await db.booking.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      token: true,
      status: true,
      appointmentTime: true,
      createdAt: true,
      doctor: {
        select: {
          name: true,
        },
      },
      diagnosis: {
        select: {
          id: true,
        },
      },
      routineGuideline: {
        select: {
          id: true,
        },
      },
      customerFeedback: {
        select: {
          id: true,
        },
      },
    },
  });

  return Response.json({
    bookings: bookings.map((booking) => ({
      id: booking.id,
      token: booking.token,
      status: booking.status,
      appointmentTime: booking.appointmentTime,
      createdAt: booking.createdAt,
      doctorName: booking.doctor?.name ?? null,
      hasDiagnosis: booking.diagnosis !== null,
      hasRoutine: booking.routineGuideline !== null,
      hasFeedback: booking.customerFeedback !== null,
    })),
  });
}
