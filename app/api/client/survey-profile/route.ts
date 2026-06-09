import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type SurveyProfilePayload = {
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
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asBoolean(value: unknown) {
  return value === true || String(value) === "true";
}

async function requireSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  return session;
}

export async function GET() {
  const session = await requireSession();

  if (session instanceof Response) {
    return session;
  }

  const [user, surveyProfile] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    }),
    db.surveyProfile.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  if (!user) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  return Response.json({
    surveyProfile: surveyProfile
      ? {
          ...surveyProfile,
          name: surveyProfile.name ?? user.name ?? "",
          email: surveyProfile.email ?? user.email ?? "",
          phone: surveyProfile.phone ?? user.phone ?? "",
        }
      : {
          name: user.name ?? "",
          age: "",
          phone: user.phone ?? "",
          email: user.email ?? "",
          skinType: "",
          usesKoreanProducts: false,
          facingSkinIssues: false,
          skinIssues: [],
          skinIssueDuration: "",
          currentProducts: [],
          allergicIngredients: [],
          doubleCleansePreference: "No",
          sleepHours: "6-8 Hours",
          waterIntake: "1-2 Litres",
          appliesSunscreen: false,
          regularPeriodCycle: false,
          usedSteroidBasedNightCream: false,
          skinImages: [],
          note: "",
        },
  });
}

export async function PUT(request: Request) {
  const session = await requireSession();

  if (session instanceof Response) {
    return session;
  }

  const body = (await request.json()) as SurveyProfilePayload;

  const data = {
    name: asOptionalString(body.name),
    age: asOptionalString(body.age),
    phone: asOptionalString(body.phone),
    email: asOptionalString(body.email),
    skinType: asOptionalString(body.skinType),
    usesKoreanProducts: asBoolean(body.usesKoreanProducts),
    facingSkinIssues: asBoolean(body.facingSkinIssues),
    skinIssues: asStringArray(body.skinIssues),
    skinIssueDuration: asOptionalString(body.skinIssueDuration),
    currentProducts: asStringArray(body.currentProducts),
    allergicIngredients: asStringArray(body.allergicIngredients),
    doubleCleansePreference: asOptionalString(body.doubleCleansePreference),
    sleepHours: asOptionalString(body.sleepHours),
    waterIntake: asOptionalString(body.waterIntake),
    appliesSunscreen: asBoolean(body.appliesSunscreen),
    regularPeriodCycle: asBoolean(body.regularPeriodCycle),
    usedSteroidBasedNightCream: asBoolean(body.usedSteroidBasedNightCream),
    note: asOptionalString(body.note),
    skinImages: asStringArray(body.skinImages).slice(0, 4),
  };

  const surveyProfile = await db.surveyProfile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      ...data,
    },
  });

  return Response.json({ surveyProfile });
}
