import { NextResponse } from "next/server";
import epsClient from "@/lib/eps";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  createNotification,
  NOTIFICATION_TYPES,
} from "@/lib/notifications";
import type { MembershipTier } from "@prisma/client";

export const runtime = "nodejs";

function getMembershipDurationDays(tier: MembershipTier) {
  switch (tier) {
    case "SIGNATURE":
      return 60;
    case "CRYSTAL":
      return 365;
    case "PLATINUM":
      return 1095;
    default:
      return 0;
  }
}

function calculateExpiresAt(tier: MembershipTier) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + getMembershipDurationDays(tier));
  return expiresAt;
}

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

function buildRedirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

function getMerchantTransactionId(request: Request) {
  const { searchParams } = new URL(request.url);

  return (
    searchParams.get("merchantTransactionId") ||
    searchParams.get("MerchantTransactionId") ||
    searchParams.get("merchant_transaction_id") ||
    ""
  ).trim();
}

function buildClientEmailHtml(input: {
  name: string;
  membershipId: string;
  tier: MembershipTier;
  amount: number;
  expiresAt: Date;
}) {
  return `
    <div style="font-family:Arial,sans-serif;color:#2B2B2B;line-height:1.6;background:#F8F5F0;padding:24px;">
      <div style="max-width:680px;margin:0 auto;background:#FFFFFF;border:1px solid #EADDCD;border-radius:16px;overflow:hidden;">
        <div style="background:#2B2B2B;padding:24px 28px;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#B87B68;">Selenite Care</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;color:#F8F5F0;">Membership Activated</h1>
        </div>
        <div style="padding:28px;">
          <p>Hi ${input.name},</p>
          <p>Your ${input.tier} membership payment has been confirmed and your membership is now active.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tbody>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Membership ID</td><td style="padding:10px;border-bottom:1px solid #EADDCD;"><strong>${input.membershipId}</strong></td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Amount</td><td style="padding:10px;border-bottom:1px solid #EADDCD;"><strong>${formatBdt(input.amount)}</strong></td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Valid Until</td><td style="padding:10px;border-bottom:1px solid #EADDCD;"><strong>${input.expiresAt.toDateString()}</strong></td></tr>
            </tbody>
          </table>
          <p style="margin-bottom:0;">You can now book consultations from your dashboard.</p>
        </div>
      </div>
    </div>
  `;
}

function buildAdminEmailHtml(input: {
  membershipId: string;
  tier: MembershipTier;
  amount: number;
  clientName: string;
  clientEmail: string;
  epsTransactionId: string;
  financialEntity: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;color:#2B2B2B;line-height:1.6;background:#F8F5F0;padding:24px;">
      <div style="max-width:680px;margin:0 auto;background:#FFFFFF;border:1px solid #EADDCD;border-radius:16px;overflow:hidden;">
        <div style="background:#2B2B2B;padding:24px 28px;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#B87B68;">Selenite Care</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;color:#F8F5F0;">EPS Membership Payment Confirmed</h1>
        </div>
        <div style="padding:28px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tbody>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Membership ID</td><td style="padding:10px;border-bottom:1px solid #EADDCD;"><strong>${input.membershipId}</strong></td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Tier</td><td style="padding:10px;border-bottom:1px solid #EADDCD;">${input.tier}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Amount</td><td style="padding:10px;border-bottom:1px solid #EADDCD;">${formatBdt(input.amount)}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Client</td><td style="padding:10px;border-bottom:1px solid #EADDCD;">${input.clientName} (${input.clientEmail})</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">EPS Transaction ID</td><td style="padding:10px;border-bottom:1px solid #EADDCD;">${input.epsTransactionId}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Financial Entity</td><td style="padding:10px;border-bottom:1px solid #EADDCD;">${input.financialEntity || "N/A"}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export async function GET(request: Request) {
  const merchantTransactionId = getMerchantTransactionId(request);

  if (!merchantTransactionId) {
    return buildRedirect(request, "/membership/payment?error=payment_failed");
  }

  try {
    const verification = await epsClient.verifyPayment({
      merchantTransactionId,
    });

    if (verification.Status?.toLowerCase() !== "success") {
      return buildRedirect(request, "/membership/payment?error=payment_failed");
    }

    const existingPayment = await db.membershipPayment.findUnique({
      where: {
        epsMerchantTxnId: merchantTransactionId,
      },
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!existingPayment) {
      return buildRedirect(request, "/membership/payment?error=payment_failed");
    }

    const expiresAt = calculateExpiresAt(existingPayment.membership.tier);

    const { payment, membership } = await db.$transaction(async (tx) => {
      const updatedPayment = await tx.membershipPayment.update({
        where: {
          id: existingPayment.id,
        },
        data: {
          status: "PAID",
          epsTransactionId: verification.EpsTransactionId,
          epsPaymentMethod: verification.FinancialEntity,
          epsStatus: verification.Status,
        },
      });

      const updatedMembership = await tx.membership.update({
        where: {
          id: existingPayment.membership.id,
        },
        data: {
          status: "ACTIVE",
          expiresAt,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        payment: updatedPayment,
        membership: updatedMembership,
      };
    });

    const clientEmail = membership.user.email;
    const clientName = membership.user.name || "Selenite Care Client";
    const adminEmail = process.env.ADMIN_EMAIL;

    await Promise.allSettled([
      clientEmail
        ? sendEmail({
            to: clientEmail,
            subject: "Your Selenite Care Membership is Active",
            html: buildClientEmailHtml({
              name: clientName,
              membershipId: membership.membershipId,
              tier: membership.tier,
              amount: payment.amount,
              expiresAt,
            }),
          })
        : Promise.resolve(),
      adminEmail
        ? sendEmail({
            to: adminEmail,
            subject: `EPS Payment Confirmed - ${membership.membershipId}`,
            html: buildAdminEmailHtml({
              membershipId: membership.membershipId,
              tier: membership.tier,
              amount: payment.amount,
              clientName,
              clientEmail: clientEmail || "N/A",
              epsTransactionId: verification.EpsTransactionId,
              financialEntity: verification.FinancialEntity,
            }),
          })
        : Promise.resolve(),
      createNotification(
        membership.userId,
        "Membership Activated",
        `Your ${membership.tier} membership is now active. Membership ID: ${membership.membershipId}`,
        NOTIFICATION_TYPES.MEMBERSHIP,
        "/dashboard",
      ),
    ]);

    return buildRedirect(
      request,
      `/membership/welcome?id=${encodeURIComponent(membership.membershipId)}`,
    );
  } catch (error) {
    console.error("EPS membership success handling failed:", error);

    return buildRedirect(request, "/membership/payment?error=payment_failed");
  }
}
