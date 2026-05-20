import { db } from "@/lib/db";

type CreateBookingPayload = {
  userId?: unknown;
  serviceId?: unknown;
  doctorId?: unknown;
  stripePaymentId?: unknown;
  appointmentTime?: unknown;
  surveyId?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateBookingPayload;
  const userId = typeof body.userId === "string" ? body.userId : "";
  const serviceId = typeof body.serviceId === "string" ? body.serviceId : "";
  const doctorId = typeof body.doctorId === "string" ? body.doctorId : null;
  const stripePaymentId =
    typeof body.stripePaymentId === "string" ? body.stripePaymentId : "";
  const appointmentTime =
    typeof body.appointmentTime === "string" ? body.appointmentTime : "";
  const surveyId = typeof body.surveyId === "string" ? body.surveyId : null;

  if (!userId || !serviceId || !stripePaymentId || !appointmentTime) {
    return Response.json(
      {
        error:
          "User ID, service ID, Stripe payment ID, and appointment time are required.",
      },
      { status: 400 },
    );
  }

  const appointmentDate = new Date(appointmentTime);

  if (Number.isNaN(appointmentDate.getTime())) {
    return Response.json(
      { error: "Appointment time must be a valid date." },
      { status: 400 },
    );
  }

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { price: true },
  });

  if (!service) {
    return Response.json({ error: "Service not found." }, { status: 404 });
  }

  // generate serial token: 001, 002, 003...
  const count = await db.booking.count();
  const token = String(count + 1).padStart(3, "0");

  const booking = await db.$transaction(async (tx) => {
    const createdBooking = await tx.booking.create({
      data: {
        token,
        userId,
        serviceId,
        doctorId,
        appointmentTime: appointmentDate,
        status: "CONFIRMED",
      },
      select: { id: true, token: true },
    });

    await tx.payment.create({
      data: {
        bookingId: createdBooking.id,
        stripePaymentId,
        amount: service.price,
        status: "PAID",
      },
    });

    // link survey to booking if surveyId provided
    if (surveyId) {
      await tx.surveyResponse.update({
        where: { id: surveyId },
        data: { bookingId: createdBooking.id },
      });
    }

    return createdBooking;
  });

  return Response.json({ token: booking.token, bookingId: booking.id });
}
