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

  const bookings = await db.booking.findMany({
    orderBy: {
      appointmentTime: "desc",
    },
    select: {
      id: true,
      token: true,
      appointmentTime: true,
      status: true,
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
      doctor: {
        select: {
          id: true,
          name: true,
          designation: true,
          availability: true,
        },
      },
      payment: true,
      surveyResponse: true,
    },
  });

  return Response.json({ bookings });
}
