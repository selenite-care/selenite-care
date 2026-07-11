import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { isMembershipAvailable } from "@/lib/membershipAvailability";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import type { MembershipTier, PaymentMethod } from "@prisma/client";

export const runtime = "nodejs";

type ManualPaymentPayload = {
  tier?: unknown;
  paymentMethod?: unknown;
  transactionRef?: unknown;
  senderNumber?: unknown;
  proofImageUrl?: unknown;
};

const MEMBERSHIP_AMOUNTS: Record<MembershipTier, number> = {
  SIGNATURE: 490,
  CRYSTAL: 3990,
  PLATINUM: 9990,
};

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

function parsePaymentMethod(value: unknown): PaymentMethod | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized === "BKASH" || normalized === "BANK_TRANSFER") {
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

function resolveMembershipAmount(tier: MembershipTier) {
  return MEMBERSHIP_AMOUNTS[tier];
}

function formatTierLabel(tier: MembershipTier) {
  switch (tier) {
    case "SIGNATURE":
      return "Signature";
    case "CRYSTAL":
      return "Crystal";
    case "PLATINUM":
      return "Platinum";
    default:
      return tier;
  }
}

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim();

  if (!adminEmail) {
    return Response.json(
      { error: "ADMIN_EMAIL is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as ManualPaymentPayload;
  const tier = parseTier(body.tier);
  const paymentMethod = parsePaymentMethod(body.paymentMethod);
  const transactionRef =
    typeof body.transactionRef === "string" ? body.transactionRef.trim() : "";
  const senderNumber =
    typeof body.senderNumber === "string" ? body.senderNumber.trim() : "";
  const proofImageUrl =
    typeof body.proofImageUrl === "string" ? body.proofImageUrl.trim() : "";

  if (!tier || !paymentMethod) {
    return Response.json(
      {
        error: "Tier and paymentMethod are required.",
      },
      { status: 400 },
    );
  }

  if (!transactionRef && !proofImageUrl) {
    return Response.json(
      {
        error:
          "Please provide either a Transaction ID or a payment confirmation screenshot.",
      },
      { status: 400 },
    );
  }

  if (!isMembershipAvailable(tier)) {
    return Response.json(
      { error: "This membership is coming soon and is not available yet." },
      { status: 403 },
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  if (!user) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  const existingPendingMembership = await db.membership.findFirst({
    where: {
      userId: user.id,
      status: "PENDING",
      NOT: {
        payment: {
          is: {
            epsMerchantTxnId: {
              not: null,
            },
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (existingPendingMembership) {
    return Response.json(
      {
        error:
          "You already have a pending membership verification. Please wait for admin to review your existing submission. If you need help, contact us directly.",
      },
      { status: 409 },
    );
  }

  try {
    const amount = resolveMembershipAmount(tier);
    const membershipId = await generateMembershipId();
    const bankTransactionRef = transactionRef
      ? senderNumber.length > 0
        ? `TrxID: ${transactionRef} | Sender: ${senderNumber}`
        : transactionRef
      : senderNumber.length > 0
        ? `Sender: ${senderNumber}`
        : null;

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
        },
      });

      await tx.membershipPayment.create({
        data: {
          membershipId: createdMembership.id,
          paymentMethod,
          status: "UNPAID",
          amount,
          bankTransactionRef,
          bankTransferProof: proofImageUrl || null,
          bkashTrxId:
            paymentMethod === "BKASH" && transactionRef ? transactionRef : null,
        },
      });

      return createdMembership;
    });

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; color: #2B2B2B; line-height: 1.6; background: #F8F5F0; padding: 24px;">
        <div style="max-width: 680px; margin: 0 auto; background: #FFFFFF; border: 1px solid #EADDCD; border-radius: 16px; overflow: hidden;">
          <div style="background: #2B2B2B; padding: 24px 28px;">
            <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #B87B68;">Selenite Care</div>
            <h1 style="margin: 12px 0 0; font-size: 28px; line-height: 1.2; color: #F8F5F0;">New Manual Payment - Pending Verification</h1>
          </div>
          <div style="padding: 28px;">
            <p style="margin-top: 0;">A new manual membership payment has been submitted and is waiting for admin verification.</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tbody>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257; width: 42%;">Client Name</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${user.name ?? "-"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Client Email</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${user.email ?? "-"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Client Phone</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${user.phone ?? "-"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Membership ID</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; font-weight: 600;">${membership.membershipId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Tier</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${formatTierLabel(tier)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Amount</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${formatBdt(amount)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Payment Method</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${paymentMethod === "BKASH" ? "bKash" : "Bank Transfer"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Transaction Reference</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${transactionRef || "Not provided"}</td>
                </tr>
                ${
                  senderNumber
                    ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Sender Number</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${senderNumber}</td>
                </tr>`
                    : ""
                }
                ${
                  proofImageUrl
                    ? `
                <tr>
                  <td style="padding: 10px 0; color: #6E6257;">Proof Image</td>
                  <td style="padding: 10px 0;"><a href="${proofImageUrl}" style="color: #B87B68;">View uploaded proof</a></td>
                </tr>`
                    : `
                <tr>
                  <td style="padding: 10px 0; color: #6E6257;">Proof Image</td>
                  <td style="padding: 10px 0;">Not provided</td>
                </tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: adminEmail,
        subject: "New Manual Payment - Pending Verification",
        html: adminHtml,
      });
    } catch (error) {
      console.error("Failed to send manual payment email", error);
    }

    try {
      await createNotification(
        user.id,
        "Payment Received",
        "We received your payment. Our team will verify and activate your membership shortly.",
        NOTIFICATION_TYPES.SUCCESS,
        "/membership/pending",
      );
    } catch (notificationError) {
      console.error("Failed to create manual payment notification", notificationError);
    }

    return Response.json({ membershipId: membership.membershipId }, { status: 201 });
  } catch (error) {
    console.error("Manual membership payment failed:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit manual payment.",
      },
      { status: 500 },
    );
  }
}
