import { NextResponse } from "next/server";
import { verifyEPSPayment } from "@/lib/eps";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  sendFacebookCAPIEvent,
  sendGA4Event,
} from "@/lib/serverAnalytics";
import {
  calculateExpiresAt,
  getProductDiscount,
  MEMBERSHIP_PRICES,
} from "@/lib/membershipDiscounts";
import {
  createNotification,
  NOTIFICATION_TYPES,
} from "@/lib/notifications";
import type { MembershipTier } from "@prisma/client";

export const runtime = "nodejs";

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

function formatBdtWithCommas(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")} BDT`;
}

function formatReadableDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
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

function buildMembershipBenefitParagraph(
  tier: MembershipTier,
  expiresAt: Date,
) {
  if (tier === "SIGNATURE") {
    const price = formatBdtWithCommas(MEMBERSHIP_PRICES.SIGNATURE.price);
    const regularPrice = formatBdtWithCommas(
      MEMBERSHIP_PRICES.SIGNATURE.originalPrice ??
        MEMBERSHIP_PRICES.SIGNATURE.price,
    );

    return `
      <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#4B4037;">
        Your Signature Membership offer price was ${price} (regular price ${regularPrice}). This offer is available for a limited time.
      </p>
    `;
  }

  const discount = getProductDiscount(tier);

  if (discount <= 0) {
    return "";
  }

  return `
    <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#4B4037;">
      As a ${formatTierLabel(tier)} member, you enjoy ${discount}% discount on all product purchases until ${formatReadableDate(expiresAt)}. Your discount is applied automatically at checkout.
    </p>
  `;
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

function readEPSField(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = data[key];

    if (value !== undefined && value !== null) {
      return {
        key,
        value: String(value),
      };
    }
  }

  return {
    key: "",
    value: "",
  };
}

function isEPSSuccess(data: Record<string, unknown>) {
  return (
    data.status === "Success" ||
    data.Status === "Success" ||
    data.transactionStatus === "Success" ||
    data.TransactionStatus === "Success" ||
    data.statusCode === "200" ||
    data.isSuccess === true
  );
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
          ${buildMembershipBenefitParagraph(input.tier, input.expiresAt)}
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

async function recordReferralSale(input: {
  membershipId: string;
  clientId: string;
  tier: MembershipTier;
  referralCode: string | null;
}) {
  if (!input.referralCode) {
    return;
  }

  try {
    const influencer = await db.influencer.findUnique({
      where: {
        referralCode: input.referralCode,
      },
      select: {
        id: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!influencer) {
      return;
    }

    const originalAmount = MEMBERSHIP_PRICES[input.tier].price;
    const discountAmount = originalAmount * 0.1;
    const clientPaid = originalAmount - discountAmount;
    const commissionAmount = originalAmount * 0.1;
    const companyReceives = clientPaid - commissionAmount;
    const influencerName = influencer.user.name || "Unknown influencer";

    await db.$transaction([
      db.influencerReferral.create({
        data: {
          influencerId: influencer.id,
          clientId: input.clientId,
          membershipId: input.membershipId,
          originalAmount,
          discountAmount,
          clientPaid,
          commissionAmount,
          companyReceives,
          status: "PENDING",
        },
      }),
      db.influencer.update({
        where: {
          id: influencer.id,
        },
        data: {
          totalEarned: {
            increment: commissionAmount,
          },
        },
      }),
    ]);

    const adminUsers = await db.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
      },
    });

    await Promise.all(
      adminUsers.map((admin) =>
        createNotification(
          admin.id,
          "New referral sale",
          `New referral sale by ${influencerName} — commission: ${formatBdt(commissionAmount)} pending`,
          NOTIFICATION_TYPES.MEMBERSHIP,
          "/admin/memberships",
        ),
      ),
    );
  } catch (error) {
    console.error("Referral sale recording failed:", error);
  }
}

export async function GET(request: Request) {
  const merchantTransactionId = getMerchantTransactionId(request);

  if (!merchantTransactionId) {
    return buildRedirect(request, "/membership/payment?error=payment_failed");
  }

  try {
    const verification = (await verifyEPSPayment(
      merchantTransactionId,
    )) as Record<string, unknown>;
    console.log(
      "EPS membership verify full response:",
      JSON.stringify(verification),
    );

    const statusField = readEPSField(verification, [
      "status",
      "Status",
      "transactionStatus",
      "TransactionStatus",
      "statusCode",
    ]);
    const epsTransactionField = readEPSField(verification, [
      "epsTransactionId",
      "EpsTransactionId",
      "transactionId",
      "TransactionId",
    ]);
    const paymentMethodField = readEPSField(verification, [
      "financialEntity",
      "FinancialEntity",
      "paymentMethod",
    ]);
    const verificationStatus =
      statusField.value || (isEPSSuccess(verification) ? "Success" : "");
    const epsTransactionId = epsTransactionField.value;
    const financialEntity = paymentMethodField.value;

    console.log("EPS membership verify fields found:", {
      statusField: statusField.key || "none",
      statusValue: statusField.value || null,
      statusCode: verification.statusCode ?? null,
      isSuccess: verification.isSuccess ?? null,
      epsTransactionIdField: epsTransactionField.key || "none",
      epsTransactionId: epsTransactionId || null,
      paymentMethodField: paymentMethodField.key || "none",
      paymentMethod: financialEntity || null,
    });

    if (!isEPSSuccess(verification)) {
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
          epsTransactionId,
          epsPaymentMethod: financialEntity,
          epsStatus: verificationStatus,
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
              phone: true,
            },
          },
        },
      });

      await tx.membershipPayment.updateMany({
        where: {
          membership: {
            is: {
              userId: existingPayment.membership.user.id,
              id: {
                not: existingPayment.membership.id,
              },
              status: "PENDING",
            },
          },
          epsMerchantTxnId: {
            not: null,
          },
          status: "UNPAID",
        },
        data: {
          epsStatus: "Superseded",
        },
      });

      await tx.membership.updateMany({
        where: {
          userId: existingPayment.membership.user.id,
          id: {
            not: existingPayment.membership.id,
          },
          status: "PENDING",
          payment: {
            is: {
              epsMerchantTxnId: {
                not: null,
              },
              status: "UNPAID",
            },
          },
        },
        data: {
          status: "CANCELLED",
        },
      });

      return {
        payment: updatedPayment,
        membership: updatedMembership,
      };
    });

    try {
      await Promise.allSettled([
        sendFacebookCAPIEvent({
          eventName: "Purchase",
          value: payment.amount,
          currency: "BDT",
          transactionId: membership.membershipId,
          email: membership.user.email ?? undefined,
          phone: membership.user.phone ?? undefined,
          name: membership.user.name ?? undefined,
        }),
        sendGA4Event({
          eventName: "purchase",
          value: payment.amount,
          currency: "BDT",
          transactionId: membership.membershipId,
          items: [
            {
              item_id: membership.tier,
              item_name: `${membership.tier} Membership - Selenite Care`,
              price: payment.amount,
              item_category: "Membership",
              quantity: 1,
            },
          ],
        }),
      ]);
    } catch (error) {
      console.error("Membership analytics dispatch failed:", error);
    }

    await recordReferralSale({
      membershipId: membership.id,
      clientId: membership.userId,
      tier: membership.tier,
      referralCode: membership.referralCode,
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
              epsTransactionId,
              financialEntity,
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
