import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
const adminEmail = process.env.ADMIN_EMAIL ?? "";

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
    select: { name: true, price: true },
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

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, phone: true },
  });

  if (!user?.email) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  const doctor = doctorId
    ? await db.doctor.findUnique({
        where: { id: doctorId },
        select: { name: true },
      })
    : null;

  const emailHtml = `
    <table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
      <thead>
        <tr>
          <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd;">Field</th>
          <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd;">Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:10px; border-bottom:1px solid #eee;">Booking Token</td>
          <td style="padding:10px; border-bottom:1px solid #eee;">${booking.token}</td>
        </tr>
        <tr>
          <td style="padding:10px; border-bottom:1px solid #eee;">Service Name</td>
          <td style="padding:10px; border-bottom:1px solid #eee;">${service.name}</td>
        </tr>
        <tr>
          <td style="padding:10px; border-bottom:1px solid #eee;">Doctor Name</td>
          <td style="padding:10px; border-bottom:1px solid #eee;">${doctor?.name ?? "Not assigned"}</td>
        </tr>
        <tr>
          <td style="padding:10px; border-bottom:1px solid #eee;">Appointment Time</td>
          <td style="padding:10px; border-bottom:1px solid #eee;">${appointmentDate.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:10px; border-bottom:1px solid #eee;">Amount Paid</td>
          <td style="padding:10px; border-bottom:1px solid #eee;">$${service.price.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:10px; border-bottom:1px solid #eee;">Message</td>
          <td style="padding:10px; border-bottom:1px solid #eee;">Our skin expert will be in touch soon.</td>
        </tr>
      </tbody>
    </table>
  `;

  await sendEmail({
    to: user.email,
    subject: "Booking Confirmed - Selenite Care",
    html: emailHtml,
  });

  // send notification to admin
  if (adminEmail) {
    const adminHtml = `
      <table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
        <thead>
          <tr>
            <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd;">Field</th>
            <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd;">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Booking Token</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${booking.token}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Client Name</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${user.name ?? "-"}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Client Phone</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${user.phone ?? "-"}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Client Email</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${user.email}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Service Name</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${service.name}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Doctor Name</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${doctor?.name ?? "Not assigned"}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Amount Paid</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">$${service.price.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    `;

    await sendEmail({
      to: adminEmail,
      subject: "New Booking Received - Selenite Care",
      html: adminHtml,
    });
  }

  return Response.json({ token: booking.token, bookingId: booking.id });
}
