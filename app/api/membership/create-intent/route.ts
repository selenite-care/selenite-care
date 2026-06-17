import { auth } from "@/auth";
import { isMembershipAvailable } from "@/lib/membershipAvailability";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

type MembershipTier = "SIGNATURE" | "CRYSTAL" | "PLATINUM";

type CreateMembershipIntentPayload = {
  tier?: unknown;
};

const BDT_PER_USD = 122;

const MEMBERSHIP_AMOUNTS: Record<MembershipTier, number> = {
  SIGNATURE: 490,
  CRYSTAL: 3990,
  PLATINUM: 9990,
};

async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  return session;
}

function parseTier(value: unknown): MembershipTier | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (
    normalized === "SIGNATURE" ||
    normalized === "CRYSTAL" ||
    normalized === "PLATINUM"
  ) {
    return normalized;
  }

  return null;
}

export async function POST(request: Request) {
  const session = await requireSession();

  if (session instanceof Response) {
    return session;
  }

  const body = (await request.json()) as CreateMembershipIntentPayload;
  const tier = parseTier(body.tier);

  if (!tier) {
    return Response.json(
      { error: "A valid membership tier is required." },
      { status: 400 },
    );
  }

  if (!isMembershipAvailable(tier)) {
    return Response.json(
      { error: "This membership is coming soon and is not available yet." },
      { status: 403 },
    );
  }

  const amountInBdt = MEMBERSHIP_AMOUNTS[tier];
  const amountInUsdCents = Math.round((amountInBdt / BDT_PER_USD) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInUsdCents,
    currency: "usd",
    metadata: {
      membershipTier: tier,
      amountInBdt: String(amountInBdt),
      userId: session.user.id,
      userEmail: session.user.email ?? "",
    },
  });

  return Response.json({
    clientSecret: paymentIntent.client_secret,
    amount: amountInBdt,
  });
}
