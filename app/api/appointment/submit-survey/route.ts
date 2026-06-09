import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const { auth } = NextAuth(authConfig);
const adminEmail = process.env.ADMIN_EMAIL ?? "";

type SurveyPayload = {
  doctorId?: unknown;
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
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const age = typeof body.age === "string" ? body.age.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const skinType = typeof body.skinType === "string" ? body.skinType.trim() : "";

  if (!doctorId || !name || !phone || !email || !skinType) {
    return Response.json(
      { error: "doctorId, name, phone, email, and skinType are required." },
      { status: 400 },
    );
  }

  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true, name: true, designation: true },
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

  try {
    const survey = await db.surveyResponse.create({
      data: {
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

    if (adminEmail) {
      const emailHtml = `
        <table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
          <thead>
            <tr>
              <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd;">Field</th>
              <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd;">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee;">Client Name</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee;">Phone</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${phone}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee;">Email</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${email}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee;">Doctor</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${doctor.name} (${doctor.designation})</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee;">Skin Type</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${skinType}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee;">Survey ID</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${survey.id}</td>
            </tr>
          </tbody>
        </table>
      `;

      await sendEmail({
        to: adminEmail,
        subject: "New Appointment Survey Submission - Selenite Care",
        html: emailHtml,
      });
    }

    return Response.json({ ok: true, surveyId: survey.id });
  } catch (error) {
    console.error("Appointment survey save error:", error);
    return Response.json(
      { error: "Failed to save survey response." },
      { status: 500 },
    );
  }
}
