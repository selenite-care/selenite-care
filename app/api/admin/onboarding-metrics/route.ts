import { createClient } from "@supabase/supabase-js";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

const { auth } = NextAuth(authConfig);

const INTENT_OPTIONS = [
  {
    id: "basic_care",
    emoji: "\uD83C\uDF3F",
    label: "Basic Care & Daily Routine",
  },
  {
    id: "target_concerns",
    emoji: "\uD83C\uDFAF",
    label: "Target Specific Concerns",
  },
  {
    id: "healthy_glow",
    emoji: "\u2728",
    label: "Healthy, Glowing Skin",
  },
  {
    id: "professional_consultation",
    emoji: "\uD83E\uDE7A",
    label: "Professional Consultation",
  },
] as const;

type IntentId = (typeof INTENT_OPTIONS)[number]["id"];

type OnboardingMetricRow = {
  intent: string | null;
  created_at: string | null;
};

function getSupabaseMetricsClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase metrics environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(dayKey: string) {
  const date = new Date(`${dayKey}T00:00:00.000Z`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function isIntentId(intent: string | null): intent is IntentId {
  return INTENT_OPTIONS.some((option) => option.id === intent);
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const authResponse = await requireAdmin();

  if (authResponse) {
    return authResponse;
  }

  try {
    const supabase = getSupabaseMetricsClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("onboarding_metrics")
      .select("intent, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as OnboardingMetricRow[];
    const countsByIntent = new Map<IntentId, number>(
      INTENT_OPTIONS.map((option) => [option.id, 0]),
    );
    const dailyCounts = new Map<
      string,
      Record<IntentId | "total", number>
    >();

    for (let index = 0; index < 30; index += 1) {
      const day = new Date(thirtyDaysAgo);
      day.setDate(thirtyDaysAgo.getDate() + index);
      const dayKey = formatDayKey(day);

      dailyCounts.set(dayKey, {
        basic_care: 0,
        target_concerns: 0,
        healthy_glow: 0,
        professional_consultation: 0,
        total: 0,
      });
    }

    rows.forEach((row) => {
      if (!isIntentId(row.intent)) {
        return;
      }

      countsByIntent.set(row.intent, (countsByIntent.get(row.intent) ?? 0) + 1);

      if (!row.created_at) {
        return;
      }

      const dayKey = formatDayKey(new Date(row.created_at));
      const dayCounts = dailyCounts.get(dayKey);

      if (!dayCounts) {
        return;
      }

      dayCounts[row.intent] += 1;
      dayCounts.total += 1;
    });

    const total = Array.from(countsByIntent.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    const metrics = INTENT_OPTIONS.map((option) => {
      const count = countsByIntent.get(option.id) ?? 0;

      return {
        ...option,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    }).sort((first, second) => second.count - first.count);
    const chartData = Array.from(dailyCounts.entries()).map(
      ([dayKey, counts]) => ({
        date: dayKey,
        label: formatDayLabel(dayKey),
        ...counts,
      }),
    );

    return Response.json({
      metrics,
      chartData,
      total,
    });
  } catch (error) {
    console.error("Unable to load onboarding metrics:", error);
    return Response.json(
      { error: "Unable to load onboarding metrics." },
      { status: 500 },
    );
  }
}
