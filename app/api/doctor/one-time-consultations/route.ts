import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "DOCTOR") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const consultations = await db.oneTimeConsultation.findMany({
      where: {
        paymentStatus: "PAID",
        booking: {
          doctor: {
            is: {
              userId: session.user.id,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        paymentStatus: true,
        includesFollowUp: true,
        followUpUsed: true,
        booking: {
          select: {
            id: true,
            token: true,
            appointmentTime: true,
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return Response.json({ consultations });
  } catch (error) {
    console.error("Failed to load doctor one-time consultations:", error);
    return Response.json(
      { error: "Unable to load one-time consultations." },
      { status: 500 },
    );
  }
}
