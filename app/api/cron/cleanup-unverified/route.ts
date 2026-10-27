import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const unpaidCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);

  try {
    const staleConsultations = await db.oneTimeConsultation.findMany({
      where: {
        paymentStatus: "UNPAID",
        createdAt: {
          lt: unpaidCutoff,
        },
      },
      select: {
        bookingId: true,
      },
    });
    const bookingIds = staleConsultations.map(
      (consultation) => consultation.bookingId,
    );

    const deletedBookings =
      bookingIds.length > 0
        ? await db.booking.deleteMany({
            where: {
              id: {
                in: bookingIds,
              },
              isOneTimeConsultation: true,
              oneTimeConsultation: {
                is: {
                  paymentStatus: "UNPAID",
                  createdAt: {
                    lt: unpaidCutoff,
                  },
                },
              },
            },
          })
        : { count: 0 };

    console.info(
      `Cleaned up ${deletedBookings.count} stale unpaid one-time consultation bookings.`,
    );

    return Response.json({
      success: true,
      unpaidConsultationsCleaned: deletedBookings.count,
      unverifiedUserCleanupDisabled: true,
    });
  } catch (error) {
    console.error("Failed to clean up stale unpaid consultations:", error);
    return Response.json(
      { error: "Failed to clean up stale unpaid consultations." },
      { status: 500 },
    );
  }
}
