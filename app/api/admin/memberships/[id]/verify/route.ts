import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  calculateExpiresAt,
  getProductDiscount,
  MEMBERSHIP_PRICES,
} from "@/lib/membershipDiscounts";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function formatTierLabel(tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM") {
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

function formatBdtWithCommas(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")} BDT`;
}

function formatReadableDate(date: Date | null) {
  if (!date) {
    return "your membership expiry date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildMembershipBenefitParagraph(
  tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM",
  expiresAt: Date | null,
) {
  if (tier === "SIGNATURE") {
    const price = formatBdtWithCommas(MEMBERSHIP_PRICES.SIGNATURE.price);
    const regularPrice = formatBdtWithCommas(
      MEMBERSHIP_PRICES.SIGNATURE.originalPrice ??
        MEMBERSHIP_PRICES.SIGNATURE.price,
    );

    return `
      <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#4B4037;">
        Your Signature Membership offer price was ${price} (regular price ${regularPrice}). Offer valid till July 30, 2026.
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

export async function PATCH(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json({ error: "Membership ID is required." }, { status: 400 });
  }

  const existingMembership = await db.membership.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
        },
      },
    },
  });

  if (!existingMembership || !existingMembership.payment) {
    return Response.json(
      { error: "Pending membership payment not found." },
      { status: 404 },
    );
  }

  if (existingMembership.status !== "PENDING") {
    return Response.json(
      { error: "Only pending memberships can be verified." },
      { status: 400 },
    );
  }

  const expiresAt = calculateExpiresAt(existingMembership.tier);

  const membership = await db.$transaction(async (tx) => {
    const updatedMembership = await tx.membership.update({
      where: { id },
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
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            createdAt: true,
          },
        },
      },
    });

    await tx.membershipPayment.update({
      where: {
        id: existingMembership.payment!.id,
      },
      data: {
        status: "PAID",
      },
    });

    return updatedMembership;
  });

  if (membership.user.email && membership.payment) {
    const tierName = formatTierLabel(membership.tier);
    const paymentMethod =
      membership.payment.paymentMethod === "BKASH" ? "bKash" : "Bank Transfer";

    try {
      await sendEmail({
        to: membership.user.email,
        subject: "Payment Receipt - Selenite Care",
        html: `
          <div style="margin:0;padding:32px 16px;background-color:#F8F5F0;font-family:Arial,sans-serif;color:#2B2B2B;">
            <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #EADDCD;border-radius:18px;overflow:hidden;">
              <div style="padding:24px 28px;background:#2B2B2B;color:#F8F5F0;">
                <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#B87B68;">Selenite Care</div>
                <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-family:'Playfair Display',Georgia,serif;">Payment Receipt</h1>
                <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#EDE6DA;">
                  Thank you for choosing Selenite Care. Your membership payment has been verified successfully.
                </p>
              </div>
              <div style="padding:28px;">
                <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">
                  Hello ${membership.user.name ?? "Valued Client"},
                </p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
                  <tbody>
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;width:42%;">Membership ID</td>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;font-weight:600;">${membership.membershipId}</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Tier</td>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${tierName}</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Amount Paid</td>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${Math.round(membership.payment.amount)} BDT</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Payment Date</td>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${membership.payment.createdAt.toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Payment Method</td>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${paymentMethod}</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Validity Start</td>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${membership.createdAt.toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Validity End</td>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${membership.expiresAt?.toLocaleDateString() ?? "To be confirmed"}</td>
                    </tr>
                  </tbody>
                </table>
                ${buildMembershipBenefitParagraph(membership.tier, membership.expiresAt)}
                <div style="margin-top:24px;padding:18px 20px;border:1px solid #EADDCD;border-radius:14px;background:#FCFAF7;">
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#4B4037;">
                    Thank you for your payment and for being part of Selenite Care. We are delighted to support your skincare journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send payment receipt email", error);
    }
  }

  try {
    await createNotification(
      membership.user.id,
      "Membership Activated!",
      `Your ${formatTierLabel(membership.tier)} membership has been activated. Welcome to Selenite Care!`,
      NOTIFICATION_TYPES.MEMBERSHIP,
      "/dashboard",
    );
  } catch (notificationError) {
    console.error("Failed to create membership activation notification", notificationError);
  }

  return Response.json({ membership });
}
