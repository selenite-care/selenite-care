import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const bookingId = new URL(request.url).searchParams.get("bookingId")?.trim();

  if (!bookingId) {
    return Response.json({ error: "Booking ID is required." }, { status: 400 });
  }

  const booking = await db.booking.findFirst({
    where: {
      id: bookingId,
      isOneTimeConsultation: true,
      oneTimeConsultation: {
        paymentStatus: "PAID",
      },
    },
    select: {
      id: true,
      token: true,
      appointmentTime: true,
      doctor: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          email: true,
          isTemporaryPassword: true,
        },
      },
    },
  });

  if (!booking) {
    return Response.json(
      { error: "Paid consultation booking not found." },
      { status: 404 },
    );
  }

  return Response.json({
    bookingId: booking.id,
    token: booking.token,
    doctorName: booking.doctor?.name ?? "Selenite Care Doctor",
    preferredDate: booking.appointmentTime,
    email: booking.user.email,
    hasTemporaryCredentials: booking.user.isTemporaryPassword,
  });
}
