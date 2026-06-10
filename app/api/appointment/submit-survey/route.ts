import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

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

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
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

  const membership = await db.membership.findUnique({
    where: { userId: session.user.id },
    select: { status: true },
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
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const age = typeof body.age === "string" ? body.age.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const skinType = typeof body.skinType === "string" ? body.skinType.trim() : "";

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
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!doctor) {
    return Response.json({ error: "Doctor not found." }, { status: 404 });
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
      ? body.doubleCleansePreference
      : "";
  const sleepHours = typeof body.sleepHours === "string" ? body.sleepHours : "";
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
