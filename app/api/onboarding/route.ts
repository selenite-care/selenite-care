import { createClient } from "@supabase/supabase-js";

const VALID_INTENTS = new Set([
  "basic_care",
  "target_concerns",
  "healthy_glow",
  "professional_consultation",
]);

type OnboardingRequestBody = {
  intent?: unknown;
  sessionId?: unknown;
};

function getSupabaseMetricsClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase metrics environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  let body: OnboardingRequestBody;

  try {
    body = (await request.json()) as OnboardingRequestBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const intent = typeof body.intent === "string" ? body.intent : "";

  if (!VALID_INTENTS.has(intent)) {
    return Response.json({ error: "Invalid onboarding intent." }, { status: 400 });
  }

  const sessionId =
    typeof body.sessionId === "string" && body.sessionId.trim()
      ? body.sessionId.trim()
      : null;
  const pageReferrer = request.headers.get("referer");

  try {
    const supabase = getSupabaseMetricsClient();
    const { error } = await supabase.from("onboarding_metrics").insert({
      intent,
      session_id: sessionId,
      page_referrer: pageReferrer,
    });

    if (error) {
      console.error("Onboarding metrics insert failed:", error);
    }
  } catch (error) {
    console.error("Onboarding metrics tracking failed:", error);
  }

  return Response.json({ success: true });
}
