import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import type { MembershipTier } from "@prisma/client";

export const runtime = "nodejs";

type CreateMembershipPayload = {
  tier?: unknown;
  stripePaymentId?: unknown;
};

const MEMBERSHIP_AMOUNTS: Record<MembershipTier, number> = {
  SIGNATURE: 490,
  CRYSTAL: 2900,
  PLATINUM: 6900,
};

const MEMBERSHIP_BENEFITS: Record<MembershipTier, string[]> = {
  SIGNATURE: [
    "100% off on the 2nd consultation",
    "120 days of online support",
    "Digital skin analysis and personalized skincare routine",
  ],
  CRYSTAL: [
    "5 complimentary follow-up consultations",
    "Specialist access including aesthetician, nutritionist, and psychiatrist",
    "Advanced skin assessment with customized care plan",
  ],
  PLATINUM: [
    "30 complimentary follow-up consultations",
    "Extended specialist access and long-term support",
    "Skin transformation roadmap with progress monitoring",
  ],
};

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

async function requireSession() {
  const session = await auth();

  if (!session?.user?.id) {
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

async function generateMembershipId() {
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const prefix = `SCM${yearSuffix}`;

  const latestMembership = await db.membership.findFirst({
    where: {
      membershipId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      membershipId: "desc",
    },
    select: {
      membershipId: true,
    },
  });

  const latestSerial = latestMembership
    ? Number(latestMembership.membershipId.slice(-4))
    : 0;

  return `${prefix}${String(latestSerial + 1).padStart(4, "0")}`;
}

function buildBenefitsSummary(tier: MembershipTier) {
  return MEMBERSHIP_BENEFITS[tier]
    .map((benefit) => `<li style="margin-bottom:8px;">${benefit}</li>`)
    .join("");
}

export async function POST(request: Request) {
  const session = await requireSession();

  if (session instanceof Response) {
    return session;
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "";

  if (!adminEmail) {
    return Response.json(
      { error: "ADMIN_EMAIL is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as CreateMembershipPayload;
  const tier = parseTier(body.tier);
  const stripePaymentId =
    typeof body.stripePaymentId === "string" ? body.stripePaymentId.trim() : "";

  if (!tier || !stripePaymentId) {
    return Response.json(
      { error: "Tier and stripePaymentId are required." },
      { status: 400 },
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      membership: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user?.email) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  if (user.membership) {
    return Response.json(
      { error: "This user already has a membership." },
      { status: 409 },
    );
  }

  const amount = MEMBERSHIP_AMOUNTS[tier];

  try {
    const membershipId = await generateMembershipId();

    const membership = await db.$transaction(async (tx) => {
      const createdMembership = await tx.membership.create({
        data: {
          membershipId,
          userId: user.id,
          tier,
          status: "PENDING",
        },
        select: {
          id: true,
          membershipId: true,
          tier: true,
        },
      });

      await tx.membershipPayment.create({
        data: {
          membershipId: createdMembership.id,
          stripePaymentId,
          amount,
          status: "PAID",
        },
      });

      return createdMembership;
    });

    const adminHtml = `
      <table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
        <thead>
          <tr>
            <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd;">Field</th>
            <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd;">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Client Name</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${user.name ?? "-"}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Client Email</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${user.email}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Client Phone</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${user.phone ?? "-"}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Tier</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${tier}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Membership ID</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${membership.membershipId}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">Amount</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${formatBdt(amount)}</td>
          </tr>
        </tbody>
      </table>
    `;

    const clientHtml = `
      <div style="font-family:Arial, sans-serif; color:#2B2B2B; line-height:1.6;">
        <h2 style="margin-bottom:12px;">Welcome to Selenite Care</h2>
        <p>Hi ${user.name ?? "there"},</p>
        <p>Your membership purchase has been confirmed successfully.</p>
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
          <tbody>
            <tr>
              <td style="padding:10px; border:1px solid #eee; font-weight:600;">Membership ID</td>
              <td style="padding:10px; border:1px solid #eee;">${membership.membershipId}</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #eee; font-weight:600;">Tier</td>
              <td style="padding:10px; border:1px solid #eee;">${tier}</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #eee; font-weight:600;">Amount Paid</td>
              <td style="padding:10px; border:1px solid #eee;">${formatBdt(amount)}</td>
            </tr>
          </tbody>
        </table>
        <h3 style="margin-bottom:10px;">Benefits Summary</h3>
        <ul style="padding-left:20px; margin-top:0;">
          ${buildBenefitsSummary(tier)}
        </ul>
        <h3 style="margin:18px 0 10px;">Next Steps</h3>
        <ul style="padding-left:20px; margin-top:0;">
          <li style="margin-bottom:8px;">Our team will review and activate your membership shortly.</li>
          <li style="margin-bottom:8px;">You may be contacted if we need any additional details.</li>
          <li style="margin-bottom:8px;">Keep your membership ID handy for future support.</li>
        </ul>
        <p>Thank you for choosing Selenite Care.</p>
      </div>
    `;

    await Promise.all([
      sendEmail({
        to: adminEmail,
        subject: "New Membership Purchase - Selenite Care",
        html: adminHtml,
      }),
      sendEmail({
        to: user.email,
        subject: "Welcome to Selenite Care - Membership Confirmed",
        html: clientHtml,
      }),
    ]);

    return Response.json({ membershipId: membership.membershipId });
  } catch (error) {
    console.error("Membership creation failed:", error);
    return Response.json(
      { error: "Failed to create membership." },
      { status: 500 },
    );
  }
}
