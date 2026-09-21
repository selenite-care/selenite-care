import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateTransactionId, initializeEPSPayment } from "@/lib/eps";
import { getSetting } from "@/lib/settings";

export const runtime = "nodejs";

const DEFAULT_CONSULTATION_PRICE = 99;

type InitiateConsultationPayload = {
  doctorId?: unknown;
  preferredDate?: unknown;
};

function parsePrice(value: string | null) {
  const price = Number(value);

  return Number.isFinite(price) && price > 0
    ? price
    : DEFAULT_CONSULTATION_PRICE;
}

function parsePreferredDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  const preferredDate = new Date(value);
  return Number.isNaN(preferredDate.getTime()) ? null : preferredDate;
}

function normalizeCustomerPhone(phone: string | null) {
  const normalizedPhone = phone?.replace(/\D/g, "").slice(-11);
  return normalizedPhone || "01000000000";
}

function getAppBaseUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin
  );
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let bookingId: string | null = null;

  try {
    const body = (await request.json().catch(() => null)) as
      | InitiateConsultationPayload
      | null;
    const doctorId =
      typeof body?.doctorId === "string" ? body.doctorId.trim() : "";
    const preferredDate = parsePreferredDate(body?.preferredDate);

    if (!doctorId || !preferredDate) {
      return Response.json(
        { error: "A valid doctor and preferred date are required." },
        { status: 400 },
      );
    }

    const [doctor, user, packagePrice] = await Promise.all([
      db.doctor.findFirst({
        where: {
          id: doctorId,
          isActive: true,
        },
        select: {
          id: true,
        },
      }),
      db.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      }),
      getSetting("one_time_consultation_price").then(parsePrice),
    ]);

    if (!doctor) {
      return Response.json(
        { error: "Doctor not found or is not currently active." },
        { status: 404 },
      );
    }

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const merchantTransactionId = generateTransactionId();
    const booking = await db.$transaction(async (tx) => {
      const activeBooking = await tx.booking.findFirst({
        where: {
          userId: user.id,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
        select: {
          id: true,
        },
      });

      if (activeBooking) {
        throw new Error("ACTIVE_BOOKING_EXISTS");
      }

      const existingBookings = await tx.booking.findMany({
        select: {
          doctorId: true,
          token: true,
        },
      });
      const usedTokens = new Set(
        existingBookings.map((existingBooking) => existingBooking.token),
      );
      const highestDoctorSerial = existingBookings.reduce(
        (highest, existingBooking) => {
          if (existingBooking.doctorId !== doctor.id) return highest;

          const serial = Number.parseInt(existingBooking.token, 10);
          return Number.isNaN(serial) ? highest : Math.max(highest, serial);
        },
        0,
      );
      let nextSerial = highestDoctorSerial + 1;
      let token = String(nextSerial).padStart(4, "0");

      while (usedTokens.has(token)) {
        nextSerial += 1;
        token = String(nextSerial).padStart(4, "0");
      }

      return tx.booking.create({
        data: {
          userId: user.id,
          doctorId: doctor.id,
          status: "PENDING",
          isOneTimeConsultation: true,
          appointmentTime: preferredDate,
          token,
          oneTimeConsultation: {
            create: {
              packagePrice,
              epsMerchantTxnId: merchantTransactionId,
            },
          },
        },
        select: {
          id: true,
        },
      });
    });
    bookingId = booking.id;

    const appBaseUrl = getAppBaseUrl(request);
    const payment = await initializeEPSPayment({
      merchantTransactionId,
      customerOrderId: `CONSULTATION-${booking.id}`,
      totalAmount: packagePrice,
      successUrl: `${appBaseUrl}/api/one-time-consultation/success`,
      failUrl: `${appBaseUrl}/api/one-time-consultation/fail`,
      cancelUrl: `${appBaseUrl}/api/one-time-consultation/cancel`,
      customerName: user.name || "Selenite Care Client",
      customerEmail: user.email || "",
      customerPhone: normalizeCustomerPhone(user.phone),
      productName: "One-Time Consultation — Selenite Care",
      valueA: booking.id,
      valueB: user.id,
    });

    return Response.json({ redirectUrl: payment.redirectUrl });
  } catch (error) {
    if (error instanceof Error && error.message === "ACTIVE_BOOKING_EXISTS") {
      return Response.json(
        {
          error:
            "You already have a pending or confirmed booking. Complete or cancel it before starting another consultation.",
        },
        { status: 409 },
      );
    }

    if (bookingId) {
      await db.booking.delete({ where: { id: bookingId } }).catch((cleanupError) => {
        console.error(
          "Failed to clean up one-time consultation booking:",
          cleanupError,
        );
      });
    }

    console.error("One-time consultation EPS initiation failed:", error);
    return Response.json(
      { error: "Unable to initiate one-time consultation payment." },
      { status: 500 },
    );
  }
}
