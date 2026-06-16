import type { MembershipStatus } from "@prisma/client";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PatchPayload = {
  status?: unknown;
  paymentMethod?: unknown;
};

const validStatuses = new Set<MembershipStatus>([
  "ACTIVE",
  "PENDING",
  "CANCELLED",
]);

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as PatchPayload;
  const status = typeof body.status === "string" ? body.status : "";
  const paymentMethod =
    typeof body.paymentMethod === "string" && body.paymentMethod.trim()
      ? body.paymentMethod.trim()
      : "Bank Transfer";

  if (!id) {
    return Response.json({ error: "Membership ID is required." }, { status: 400 });
  }

  if (!validStatuses.has(status as MembershipStatus)) {
    return Response.json({ error: "Invalid membership status." }, { status: 400 });
  }

  const membership = await db.membership.update({
    where: { id },
    data: {
      status: status as MembershipStatus,
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
          stripePaymentId: true,
          createdAt: true,
        },
      },
    },
  });

  if (
    membership.status === "ACTIVE" &&
    membership.user.email &&
    membership.payment
  ) {
    const tierName =
      membership.tier === "SIGNATURE"
        ? "Signature"
        : membership.tier === "CRYSTAL"
          ? "Crystal"
          : "Platinum";
    const startDate = membership.createdAt;
    const endDate = membership.expiresAt;
    const amountPaid = `${Math.round(membership.payment.amount)} BDT`;
    const paymentDate = membership.payment.createdAt.toLocaleDateString();
    const validityStart = startDate.toLocaleDateString();
    const validityEnd = endDate
      ? endDate.toLocaleDateString()
      : "To be confirmed";

    try {
      await sendEmail({
        to: membership.user.email,
        subject: "Payment Receipt - Selenite Care",
        html: `
        <div style="margin:0;padding:32px 16px;background-color:#F8F5F0;font-family:Arial,sans-serif;color:#2B2B2B;">
          <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #D8C7B5;border-radius:18px;overflow:hidden;">
            <div style="padding:24px 28px;background:#2B2B2B;color:#F8F5F0;">
              <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#C6A56B;">Selenite Care</div>
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
                    <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${amountPaid}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Payment Date</td>
                    <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${paymentDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Payment Method</td>
                    <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Validity Start</td>
                    <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${validityStart}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Validity End</td>
                    <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${validityEnd}</td>
                  </tr>
                </tbody>
              </table>

              <div style="margin-top:24px;padding:18px 20px;border:1px solid #D8C7B5;border-radius:14px;background:#FCFAF7;">
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
      console.error("Failed to send membership receipt email", error);
    }
  }

  return Response.json({ membership });
}
