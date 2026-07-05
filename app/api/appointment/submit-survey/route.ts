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
  currentProductsImage?: unknown;
  previousConsultation?: unknown;
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

function asNullableBoolean(value: unknown) {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return null;
}

function asBoolean(value: unknown) {
  return value === true || value === "true";
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
            <td style="padding:10px; border:1px solid #EADDCD; font-weight:bold;">Booking Token</td>
            <td style="padding:10px; border:1px solid #EADDCD;">${bookingToken}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #EADDCD; font-weight:bold;">Client Name</td>
            <td style="padding:10px; border:1px solid #EADDCD;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #EADDCD; font-weight:bold;">Client Phone</td>
            <td style="padding:10px; border:1px solid #EADDCD;">${clientPhone}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #EADDCD; font-weight:bold;">Client Email</td>
            <td style="padding:10px; border:1px solid #EADDCD;">${clientEmail}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #EADDCD; font-weight:bold;">Selected Doctor</td>
            <td style="padding:10px; border:1px solid #EADDCD;">${doctorName}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #EADDCD; font-weight:bold;">Preferred Date</td>
            <td style="padding:10px; border:1px solid #EADDCD;">${preferredDate}</td>
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

  const body = (await request.json()) as SurveyPayload;

  const doctorId = asOptionalString(body.doctorId);
  const preferredDateInput =
    typeof body.preferredDate === "string"
      ? body.preferredDate.trim()
      : typeof body.date === "string"
        ? body.date.trim()
        : "";
  const name = asOptionalString(body.name);
  const age = asOptionalString(body.age);
  const phone = asOptionalString(body.phone);
  const email = asOptionalString(body.email);
  const skinType = asOptionalString(body.skinType);
  let preferredDate: Date | null = null;

  if (preferredDateInput) {
    const parsedPreferredDate = new Date(preferredDateInput);

    if (Number.isNaN(parsedPreferredDate.getTime())) {
      return Response.json({ error: "Preferred date is invalid." }, { status: 400 });
    }

    preferredDate = parsedPreferredDate;
  }

  const doctor = doctorId
    ? await db.doctor.findUnique({
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
      })
    : null;

  if (doctorId && !doctor) {
    return Response.json({ error: "Doctor not found." }, { status: 404 });
  }

  if (doctor && preferredDateInput === toDateInputValue(new Date())) {
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

  const usesKoreanProducts = asBoolean(body.usesKoreanProducts);
  const facingSkinIssues = asBoolean(body.facingSkinIssues);
  const skinIssues = asStringArray(body.skinIssues);
  const skinIssueDuration = asOptionalString(body.skinIssueDuration);
  const currentProducts = asStringArray(body.currentProducts);
  const currentProductsImage = asOptionalString(body.currentProductsImage);
  const previousConsultation = asNullableBoolean(body.previousConsultation);
  const allergicIngredients = asStringArray(body.allergicIngredients);
  const doubleCleansePreference = asOptionalString(body.doubleCleansePreference);
  const sleepHours = asOptionalString(body.sleepHours);
  const appliesSunscreen = asBoolean(body.appliesSunscreen);
  const regularPeriodCycle = asBoolean(body.regularPeriodCycle);
  const usedSteroidBasedNightCream = asBoolean(body.usedSteroidBasedNightCream);
  const note = asOptionalString(body.note);
  const waterIntake = asOptionalString(body.waterIntake);
  const skinImages = asStringArray(body.skinImages).slice(0, 4);
  const preferredDateLabel = preferredDate
    ? formatPreferredDate(preferredDate)
    : "Not selected";

  try {
    const activeBooking = await db.booking.findFirst({
      where: {
        userId: session.user.id,
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
      select: {
        id: true,
      },
    });

    if (activeBooking) {
      return Response.json(
        {
          error:
            "You already have an active appointment. Please wait for your current appointment to be completed before booking a new one.",
        },
        { status: 409 },
      );
    }

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
          doctorId: doctor?.id ?? null,
          appointmentTime: preferredDate,
        },
      });

      const survey = await tx.surveyResponse.create({
        data: {
          bookingId: booking.id,
          codeId: doctorId,
          name: name ?? "",
          age: age ?? "",
          phone: phone ?? "",
          email: email ?? "",
          skinType: skinType ?? "",
          usesKoreanProducts,
          facingSkinIssues,
          skinIssues,
          skinIssueDuration,
          currentProducts,
          currentProductsImage,
          previousConsultation,
          allergicIngredients,
          doubleCleansePreference: doubleCleansePreference ?? "",
          sleepHours: sleepHours ?? "",
          waterIntake: waterIntake ?? "",
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
          age,
          phone,
          email,
          skinType,
          usesKoreanProducts,
          facingSkinIssues,
          skinIssues,
          skinIssueDuration,
          currentProducts,
          currentProductsImage,
          previousConsultation,
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
        create: {
          userId: session.user.id,
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
          currentProductsImage,
          previousConsultation,
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

      return { booking, survey };
    });

    const clientName = name ?? "Not provided";
    const clientPhone = phone ?? "Not provided";
    const clientEmail = email ?? "Not provided";
    const doctorName = doctor
      ? `${doctor.name} (${doctor.designation})`
      : "Not selected";

    const adminEmailHtml = buildAppointmentEmailHtml({
      bookingToken: booking.token,
      clientName,
      clientPhone,
      clientEmail,
      doctorName,
      preferredDate: preferredDateLabel,
      footerMessage:
        "A new appointment request has been submitted and is awaiting follow-up.",
    });

    const doctorEmailHtml = buildAppointmentEmailHtml({
      bookingToken: booking.token,
      clientName,
      clientPhone,
      clientEmail,
      doctorName,
      preferredDate: preferredDateLabel,
      footerMessage:
        "Please review this assigned appointment request and await CRM confirmation.",
    });

    const clientEmailHtml = buildAppointmentEmailHtml({
      bookingToken: booking.token,
      clientName,
      clientPhone,
      clientEmail,
      doctorName,
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

    if (doctor?.user?.email) {
      emailPromises.push(
        sendEmail({
          to: doctor.user.email,
          subject: "New Appointment Assigned - Selenite Care",
          html: doctorEmailHtml,
        }),
      );
    }

    if (email) {
      emailPromises.push(
        sendEmail({
          to: email,
          subject: "Appointment Request Confirmed - Selenite Care",
          html: clientEmailHtml,
        }),
      );
    }

    if (doctor?.user?.id) {
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
