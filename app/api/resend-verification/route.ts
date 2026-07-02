import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

type ResendVerificationPayload = {
  email?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ResendVerificationPayload;
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
      emailVerified: true,
    },
  });

  if (!user) {
    return Response.json({
      message:
        "If an account with that email exists, a verification link has been sent.",
    });
  }

  if (user.emailVerified) {
    return Response.json({
      message: "This email is already verified. Please login.",
    });
  }

  const verificationToken = randomUUID();

  await db.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
    },
  });

  await sendEmail({
    to: user.email,
    subject: "Verify your email - Selenite Care",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #2B2B2B;">
        <h2 style="margin-bottom: 16px;">Verify your email</h2>
        <p>Hello ${user.name ?? "there"},</p>
        <p>Here is a fresh verification link for your Selenite Care account.</p>
        <p style="margin: 24px 0;">
          <a
            href="https://selenitecare.com/verify-email?token=${verificationToken}"
            style="display: inline-block; background: #2B2B2B; color: #F8F5F0; text-decoration: none; padding: 12px 20px; border-radius: 8px;"
          >
            Verify Email
          </a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p>
          <a href="https://selenitecare.com/verify-email?token=${verificationToken}" style="color: #B87B68;">
            https://selenitecare.com/verify-email?token=${verificationToken}
          </a>
        </p>
      </div>
    `,
  });

  return Response.json({
    message:
      "If an account with that email exists, a verification link has been sent.",
  });
}
