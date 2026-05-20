import { db } from "@/lib/db";

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
  wantsConsultation?: unknown;
  appliesSunscreen?: unknown;
  regularPeriodCycle?: unknown;
  usedIndoPakNightCream?: unknown;
  note?: unknown;
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
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
  const wantsConsultation = body.wantsConsultation === true || String(body.wantsConsultation) === "true";
  const appliesSunscreen = body.appliesSunscreen === true || String(body.appliesSunscreen) === "true";
  const regularPeriodCycle = body.regularPeriodCycle === true || String(body.regularPeriodCycle) === "true";
  const usedIndoPakNightCream =
    body.usedIndoPakNightCream === true || String(body.usedIndoPakNightCream) === "true";
  const note = typeof body.note === "string" ? body.note.trim() : null;

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
        waterIntake: asStringArray(body.waterIntake), // keep as array
        wantsConsultation,
        appliesSunscreen,
        regularPeriodCycle,
        usedIndoPakNightCream,
        note,
      },
    });

    return Response.json({ ok: true, surveyId: survey.id });
  } catch (err) {
    console.error("Survey save error:", err)
    return Response.json({ error: "Failed to save survey response." }, { status: 500 });
  }
}
