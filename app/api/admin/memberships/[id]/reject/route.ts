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

type RejectPayload = {
  reason?: unknown;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as RejectPayload;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!id) {
    return Response.json({ error: "Membership ID is required." }, { status: 400 });
  }

  if (!reason) {
    return Response.json(
      { error: "Rejection reason is required." },
      { status: 400 },
    );
  }

  const membership = await db.membership.update({
    where: { id },
    data: {
      status: "CANCELLED",
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
          paymentMethod: true,
        },
      },
    },
  });

  if (membership.user.email) {
    try {
      await sendEmail({
        to: membership.user.email,
        subject: "Membership Payment Rejected - Selenite Care",
        html: `
          <div style="margin:0;padding:32px 16px;background-color:#F8F5F0;font-family:Arial,sans-serif;color:#2B2B2B;">
            <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #D8C7B5;border-radius:18px;overflow:hidden;">
              <div style="padding:24px 28px;background:#2B2B2B;color:#F8F5F0;">
                <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#C6A56B;">Selenite Care</div>
                <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-family:'Playfair Display',Georgia,serif;">Payment Verification Update</h1>
              </div>
              <div style="padding:28px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
                  Hello ${membership.user.name ?? "Valued Client"},
                </p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4B4037;">
                  We could not verify your submitted membership payment for <strong>${membership.membershipId}</strong>.
                </p>
                <div style="padding:18px 20px;border:1px solid #D8C7B5;border-radius:14px;background:#FCFAF7;">
                  <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#8C7967;">Reason</p>
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#2B2B2B;">${reason}</p>
                </div>
                <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#4B4037;">
                  Please review the payment details and submit a fresh payment request if needed. If you believe this is an error, contact our support team.
                </p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send membership rejection email", error);
    }
  }

  return Response.json({ membership });
}
