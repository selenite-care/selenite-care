import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function getDhakaTodayRange() {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const start = new Date(`${date}T00:00:00+06:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const summaryOnly = searchParams.get("summaryOnly") === "true";
    const { start, end } = getDhakaTodayRange();

    const todayCount = await db.oneTimeConsultation.count({
      where: {
        paymentStatus: "PAID",
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });

    if (summaryOnly) {
      return Response.json({ todayCount });
    }

    const consultations = await db.oneTimeConsultation.findMany({
      where: {
        paymentStatus: "PAID",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        paymentStatus: true,
        followUpUsed: true,
        booking: {
          select: {
            id: true,
            token: true,
            doctorId: true,
            appointmentTime: true,
            doctor: {
              select: {
                name: true,
              },
            },
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

    return Response.json({ consultations, todayCount });
  } catch (error) {
    console.error("Failed to load CRM one-time consultations:", error);
    return Response.json(
      { error: "Unable to load one-time consultations." },
      { status: 500 },
    );
  }
}
