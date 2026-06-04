import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const adminEmail = process.env.ADMIN_EMAIL ?? "";

if (!adminEmail) {
  throw new Error("ADMIN_EMAIL is not set.");
}

type SurveyPayload = {
  serviceId?: unknown;
  codeId?: unknown;
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
  const body = (await request.json()) as SurveyPayload;

  const serviceId = typeof body.serviceId === "string" ? body.serviceId.trim() : "";
  const codeId = typeof body.codeId === "string" ? body.codeId : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const age = typeof body.age === "string" ? body.age.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const skinType = typeof body.skinType === "string" ? body.skinType.trim() : "";

  if (!serviceId || !name || !phone || !email || !skinType) {
    return Response.json(
      { error: "serviceId, name, phone, email, and skinType are required." },
      { status: 400 },
    );
  }

  const usesKoreanProducts =
    body.usesKoreanProducts === true || String(body.usesKoreanProducts) === "true";
  const facingSkinIssues =
    body.facingSkinIssues === true || String(body.facingSkinIssues) === "true";

  const skinIssues = asStringArray(body.skinIssues);
  const skinIssueDuration =
    typeof body.skinIssueDuration === "string" ? body.skinIssueDuration.trim() : null;
  const currentProducts = asStringArray(body.currentProducts);
  const allergicIngredients = asStringArray(body.allergicIngredients);

  const doubleCleansePreference =
    typeof body.doubleCleansePreference === "string" ? body.doubleCleansePreference : "";
  const sleepHours = typeof body.sleepHours === "string" ? body.sleepHours : "";
  const appliesSunscreen = body.appliesSunscreen === true || String(body.appliesSunscreen) === "true";
  const regularPeriodCycle = body.regularPeriodCycle === true || String(body.regularPeriodCycle) === "true";
  const usedSteroidBasedNightCream =
    body.usedSteroidBasedNightCream === true || String(body.usedSteroidBasedNightCream) === "true";
  const note = typeof body.note === "string" ? body.note.trim() : null;
  const waterIntake = asOptionalString(body.waterIntake) ?? "";
  const skinImages = asStringArray(body.skinImages).slice(0, 4);

  try {
    const survey = await db.surveyResponse.create({
      data: {
        codeId,
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

    const formattedSkinIssues = skinIssues.length ? skinIssues.join(", ") : "None";
    const formattedCurrentProducts = currentProducts.length ? currentProducts.join(", ") : "None";
    const formattedNote = note || "None";

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
            <td style="padding:10px; border-bottom:1px solid #eee;">Skin Type</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${skinType}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Skin Issues</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${formattedSkinIssues}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Current Products</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${formattedCurrentProducts}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Note</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${formattedNote}</td>
          </tr>
        </tbody>
      </table>
    `;

    await sendEmail({
      to: adminEmail,
      subject: "New Survey Submission - Selenite Care",
      html: emailHtml,
    });

    return Response.json({ ok: true, surveyId: survey.id });
  } catch (err) {
    console.error("Survey save error:", err);
    return Response.json({ error: "Failed to save survey response." }, { status: 500 });
  }
}
