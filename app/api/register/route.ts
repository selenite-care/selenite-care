import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

type RegisterPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
};

const INTERNATIONAL_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterPayload;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || !email || !phone || !password) {
    return Response.json(
      { error: "Name, email, phone, and password are required." },
      { status: 400 },
    );
  }

  if (!INTERNATIONAL_PHONE_REGEX.test(phone)) {
    return Response.json(
      { error: "Please enter a valid phone number with country code" },
      { status: 400 },
    );
  }

  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return Response.json(
      { error: "A user with this email already exists." },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = randomUUID();

  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: "CLIENT",
      verificationToken,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  await sendEmail({
    to: email,
    subject: "Verify your email - Selenite Care",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #2B2B2B;">
        <h2 style="margin-bottom: 16px;">Verify your email</h2>
        <p>Welcome to Selenite Care, ${name}.</p>
        <p>Please verify your email address before signing in to your account.</p>
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
          <a href="https://selenitecare.com/verify-email?token=${verificationToken}" style="color: #C6A56B;">
            https://selenitecare.com/verify-email?token=${verificationToken}
          </a>
        </p>
      </div>
    `,
  });

  return Response.json({ user }, { status: 201 });
}
