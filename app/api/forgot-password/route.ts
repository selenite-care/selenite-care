import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

type ForgotPasswordPayload = {
  email?: unknown;
};

const GENERIC_SUCCESS_MESSAGE =
  "If an account with that email exists, a password reset link has been sent.";

export async function POST(request: Request) {
  const body = (await request.json()) as ForgotPasswordPayload;
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    return Response.json({ message: GENERIC_SUCCESS_MESSAGE });
  }

  const resetPasswordToken = randomUUID();
  const resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60);

  await db.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken,
      resetPasswordExpires,
    },
  });

  await sendEmail({
    to: user.email,
    subject: "Reset your password - Selenite Care",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#F8F5F0;font-family:Arial,sans-serif;color:#2B2B2B;">
        <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #EADDCD;border-radius:18px;overflow:hidden;">
          <div style="padding:24px 28px;background:#2B2B2B;color:#F8F5F0;">
            <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#B87B68;">Selenite Care</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-family:'Playfair Display',Georgia,serif;">Reset Your Password</h1>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
              Hello ${user.name ?? "there"},
            </p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#6E6257;">
              We received a request to reset your Selenite Care password. Use the button below to create a new one.
            </p>
            <p style="margin:24px 0;">
              <a
                href="https://selenitecare.com/reset-password?token=${resetPasswordToken}"
                style="display:inline-block;background:#2B2B2B;color:#F8F5F0;text-decoration:none;padding:12px 20px;border-radius:8px;"
              >
                Reset Password
              </a>
            </p>
            <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#6E6257;">
              This link will expire in 1 hour.
            </p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#6E6257;">
              If the button does not work, copy and paste this link into your browser:
            </p>
            <p style="margin:12px 0 0;">
              <a href="https://selenitecare.com/reset-password?token=${resetPasswordToken}" style="color:#B87B68;">
                https://selenitecare.com/reset-password?token=${resetPasswordToken}
              </a>
            </p>
          </div>
        </div>
      </div>
    `,
  });

  return Response.json({ message: GENERIC_SUCCESS_MESSAGE });
}
