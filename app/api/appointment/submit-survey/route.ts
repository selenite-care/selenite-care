import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { sanitizeText } from "@/lib/sanitize";

const { auth } = NextAuth(authConfig);
const adminEmail = process.env.ADMIN_EMAIL ?? "";

type SurveyPayload = {
  doctorId?: unknown;
  preferredDate?: unknown;
  date?: unknown;
  name?: unknown;
  age?: unknown;
  phone?: unknown;
  email?: unknown;
  skinType?: unknown;
  usesKoreanProducts?: unknown;
  facingSkinIssues?: unknown;
  skinIssues?: unknown;
  skinIssueDuration?: unknown;
  currentProducts?: unknown;
  allergicIngredients?: unknown;
  doubleCleansePreference?: unknown;
  sleepHours?: unknown;
  waterIntake?: unknown;
  appliesSunscreen?: unknown;
  regularPeriodCycle?: unknown;
  usedSteroidBasedNightCream?: unknown;
  note?: unknown;
  skinImages?: unknown;
};

function normalizeAvailabilityText(availability: string) {
  return availability
    .replaceAll("ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ", "-")
    .replaceAll("ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“", "-")
    .replaceAll("Ã¢â‚¬â€œ", "-")
    .replaceAll("Ã¢â‚¬â€", "-")
    .replaceAll("â€“", "-")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .trim();
}

function parseAvailabilityEndTime(availability: string) {
  const normalizedAvailability = normalizeAvailabilityText(availability);
  const segments = normalizedAvailability
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const timeSegment = [...segments]
    .reverse()
    .find((segment) => /(?:AM|PM)/i.test(segment) && segment.includes("-"));

  if (!timeSegment) {
    return null;
  }

  const [, endTimeRaw] = timeSegment.split("-");
  const endTimeLabel = endTimeRaw?.trim();

  if (!endTimeLabel) {
    return null;
  }

  const match = endTimeLabel.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const meridiem = match[3].toUpperCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  let hours24 = hours % 12;

  if (meridiem === "PM") {
    hours24 += 12;
  }

  return {
    hours24,
    minutes,
  };
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => sanitizeText(String(v)))
      .filter(Boolean);
  }
  if (typeof value === "string" && value.length > 0) {
    const sanitized = sanitizeText(value);
    return sanitized ? [sanitized] : [];
  }
  return [];
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = sanitizeText(value);
  return trimmed.length > 0 ? trimmed : null;
}

function formatPreferredDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildAppointmentEmailHtml({
  bookingToken,
  clientName,
  clientPhone,
  clientEmail,
  doctorName,
  preferredDate,
  footerMessage,
}: {
  bookingToken: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  doctorName: string;
  preferredDate: string;
  footerMessage: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #2B2B2B; line-height: 1.6;">
      <h1 style="color: #2B2B2B; margin-bottom: 16px;">Selenite Care</h1>
      <table style="width:100%; border-collapse:collapse;">
        <tbody>
          <tr>
            <td style="padding:10px; border:1px solid #D8C7B5; font-weight:bold;">Booking Token</td>
            <td style="padding:10px; border:1px solid #D8C7B5;">${bookingToken}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #D8C7B5; font-weight:bold;">Client Name</td>
            <td style="padding:10px; border:1px solid #D8C7B5;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #D8C7B5; font-weight:bold;">Client Phone</td>
            <td style="padding:10px; border:1px solid #D8C7B5;">${clientPhone}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #D8C7B5; font-weight:bold;">Client Email</td>
            <td style="padding:10px; border:1px solid #D8C7B5;">${clientEmail}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #D8C7B5; font-weight:bold;">Selected Doctor</td>
            <td style="padding:10px; border:1px solid #D8C7B5;">${doctorName}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #D8C7B5; font-weight:bold;">Preferred Date</td>
            <td style="padding:10px; border:1px solid #D8C7B5;">${preferredDate}</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 18px;">${footerMessage}</p>
    </div>
  `;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const membership = await db.membership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      status: true,
      tier: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  if (membership?.status !== "ACTIVE") {
    return Response.json(
      { error: "An active membership is required to submit this survey." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as SurveyPayload;

  const doctorId =
    typeof body.doctorId === "string" ? body.doctorId.trim() : "";
  const preferredDateInput =
    typeof body.preferredDate === "string"
      ? body.preferredDate.trim()
      : typeof body.date === "string"
        ? body.date.trim()
        : "";
  const name = typeof body.name === "string" ? sanitizeText(body.name) : "";
  const age = typeof body.age === "string" ? sanitizeText(body.age) : "";
  const phone = typeof body.phone === "string" ? sanitizeText(body.phone) : "";
  const email = typeof body.email === "string" ? sanitizeText(body.email) : "";
  const skinType = typeof body.skinType === "string" ? sanitizeText(body.skinType) : "";

  if (!doctorId || !preferredDateInput || !name || !phone || !email || !skinType) {
    return Response.json(
      {
        error:
          "doctorId, preferredDate, name, phone, email, and skinType are required.",
      },
      { status: 400 },
    );
  }

  const preferredDate = new Date(preferredDateInput);

  if (Number.isNaN(preferredDate.getTime())) {
    return Response.json({ error: "Preferred date is invalid." }, { status: 400 });
  }

  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      name: true,
      designation: true,
      specialization: true,
      availability: true,
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!doctor) {
    return Response.json({ error: "Doctor not found." }, { status: 404 });
  }

  if (preferredDateInput === toDateInputValue(new Date())) {
    const endTime = parseAvailabilityEndTime(doctor.availability);

    if (endTime) {
      const now = new Date();
      const cutoffMinutes = endTime.hours24 * 60 + endTime.minutes - 120;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      if (currentMinutes >= cutoffMinutes) {
        return Response.json(
          {
            error:
              "Booking cutoff has passed for today. Please select a future date.",
          },
          { status: 400 },
        );
      }
    }
  }

  const usesKoreanProducts =
    body.usesKoreanProducts === true ||
    String(body.usesKoreanProducts) === "true";
  const facingSkinIssues =
    body.facingSkinIssues === true ||
    String(body.facingSkinIssues) === "true";
  const skinIssues = asStringArray(body.skinIssues);
  const skinIssueDuration = asOptionalString(body.skinIssueDuration);
  const currentProducts = asStringArray(body.currentProducts);
  const allergicIngredients = asStringArray(body.allergicIngredients);
  const doubleCleansePreference =
    typeof body.doubleCleansePreference === "string"
      ? sanitizeText(body.doubleCleansePreference)
      : "";
  const sleepHours = typeof body.sleepHours === "string" ? sanitizeText(body.sleepHours) : "";
  const appliesSunscreen =
    body.appliesSunscreen === true || String(body.appliesSunscreen) === "true";
  const regularPeriodCycle =
    body.regularPeriodCycle === true ||
    String(body.regularPeriodCycle) === "true";
  const usedSteroidBasedNightCream =
    body.usedSteroidBasedNightCream === true ||
    String(body.usedSteroidBasedNightCream) === "true";
  const note = asOptionalString(body.note);
  const waterIntake = asOptionalString(body.waterIntake) ?? "";
  const skinImages = asStringArray(body.skinImages).slice(0, 4);
  const preferredDateLabel = formatPreferredDate(preferredDate);

  try {
    const { booking, survey } = await db.$transaction(async (tx) => {
      const existingTokens = await tx.booking.findMany({
        select: { token: true },
      });

      const highestSerial = existingTokens.reduce((max, existingBooking) => {
        const numericToken = Number.parseInt(existingBooking.token, 10);

        if (!Number.isNaN(numericToken)) {
          return Math.max(max, numericToken);
        }

        return max;
      }, 0);

      const bookingToken = String(highestSerial + 1).padStart(4, "0");

      const booking = await tx.booking.create({
        data: {
          token: bookingToken,
          userId: session.user.id,
          doctorId: doctor.id,
          appointmentTime: preferredDate,
        },
      });

      const survey = await tx.surveyResponse.create({
        data: {
          bookingId: booking.id,
          codeId: doctorId,
          name,
          age,
          phone,
          email,
          skinType,
          usesKoreanProducts,
          facingSkinIssues,
          skinIssues,
          skinIssueDuration,
          currentProducts,
          allergicIngredients,
          doubleCleansePreference,
          sleepHours,
          waterIntake,
          appliesSunscreen,
          regularPeriodCycle,
          usedSteroidBasedNightCream,
          note,
          skinImages,
        },
      });

      await tx.surveyProfile.upsert({
        where: {
          userId: session.user.id,
        },
        update: {
          name,
          age: age || null,
          phone,
          email,
          skinType,
          usesKoreanProducts,
          facingSkinIssues,
          skinIssues,
          skinIssueDuration,
          currentProducts,
          allergicIngredients,
          doubleCleansePreference: doubleCleansePreference || null,
          sleepHours: sleepHours || null,
          waterIntake: waterIntake || null,
          appliesSunscreen,
          regularPeriodCycle,
          usedSteroidBasedNightCream,
          note,
          skinImages,
        },
        create: {
          userId: session.user.id,
          name,
          age: age || null,
          phone,
          email,
          skinType,
          usesKoreanProducts,
          facingSkinIssues,
          skinIssues,
          skinIssueDuration,
          currentProducts,
          allergicIngredients,
          doubleCleansePreference: doubleCleansePreference || null,
          sleepHours: sleepHours || null,
          waterIntake: waterIntake || null,
          appliesSunscreen,
          regularPeriodCycle,
          usedSteroidBasedNightCream,
          note,
          skinImages,
        },
      });

      return { booking, survey };
    });

    const adminEmailHtml = buildAppointmentEmailHtml({
      bookingToken: booking.token,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      doctorName: `${doctor.name} (${doctor.designation})`,
      preferredDate: preferredDateLabel,
      footerMessage:
        "A new appointment request has been submitted and is awaiting follow-up.",
    });

    const doctorEmailHtml = buildAppointmentEmailHtml({
      bookingToken: booking.token,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      doctorName: `${doctor.name} (${doctor.designation})`,
      preferredDate: preferredDateLabel,
      footerMessage:
        "Please review this assigned appointment request and await CRM confirmation.",
    });

    const clientEmailHtml = buildAppointmentEmailHtml({
      bookingToken: booking.token,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      doctorName: `${doctor.name} (${doctor.designation})`,
      preferredDate: preferredDateLabel,
      footerMessage:
        "Our CRM team will contact you shortly to confirm your appointment time.",
    });

    const emailPromises: Promise<unknown>[] = [];

    if (adminEmail) {
      emailPromises.push(
        sendEmail({
          to: adminEmail,
          subject: "New Appointment - Selenite Care",
          html: adminEmailHtml,
        }),
      );
    }

    if (doctor.user?.email) {
      emailPromises.push(
        sendEmail({
          to: doctor.user.email,
          subject: "New Appointment Assigned - Selenite Care",
          html: doctorEmailHtml,
        }),
      );
    }

    emailPromises.push(
      sendEmail({
        to: email,
        subject: "Appointment Request Confirmed - Selenite Care",
        html: clientEmailHtml,
      }),
    );

    if (doctor.user?.id) {
      try {
        await createNotification(
          doctor.user.id,
          "New Appointment",
          `A new appointment has been booked with you. Token: ${booking.token}`,
          NOTIFICATION_TYPES.BOOKING,
          `/doctor/bookings/${booking.id}`,
        );
      } catch (notificationError) {
        console.error("Failed to create doctor appointment notification", notificationError);
      }
    }

    await Promise.all(emailPromises);

    return Response.json({
      ok: true,
      surveyId: survey.id,
      bookingId: booking.id,
      bookingToken: booking.token,
    });
  } catch (error) {
    console.error("Appointment survey save error:", error);
    return Response.json(
      { error: "Failed to save survey response." },
      { status: 500 },
    );
  }
}
