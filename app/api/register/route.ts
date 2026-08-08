import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { appendToSheet } from "@/lib/googleSheets";
import { sanitizeEmail, sanitizeName, sanitizePhone } from "@/lib/sanitize";

type RegisterPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
  dateOfBirth?: unknown;
  source?: unknown;
  formLoadTime?: unknown;
  recaptchaToken?: unknown;
};

const RECAPTCHA_MIN_SCORE = 0.5;
const MIN_FORM_COMPLETION_TIME_MS = 4000;
const NAME_PATTERN = /^[A-Za-z\s'-]+$/;
const BOT_EMAIL_DOT_PATTERN = /(\w\.){2,}\w+@/;

type RecaptchaVerifyResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

function registrationFailedResponse() {
  return Response.json(
    { error: "Registration failed. Please try again." },
    { status: 400 },
  );
}

function hasValidPhoneFormat(value: string) {
  const digits = value.replace(/\D/g, "");

  return /^[+0]/.test(value) && digits.length >= 11;
}

function wasSubmittedTooQuickly(value: unknown) {
  const formLoadTime =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  if (!Number.isFinite(formLoadTime)) {
    return true;
  }

  return Date.now() - formLoadTime < MIN_FORM_COMPLETION_TIME_MS;
}

async function verifyRecaptchaToken(token: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();

  if (!secret) {
    throw new Error("RECAPTCHA_SECRET_KEY is not configured.");
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret,
      response: token,
    }),
  });

  if (!response.ok) {
    throw new Error(`reCAPTCHA verification failed with ${response.status}.`);
  }

  const data = (await response.json()) as RecaptchaVerifyResponse;
  const score = typeof data.score === "number" ? data.score : 0;

  console.log("Register reCAPTCHA score:", {
    success: data.success === true,
    score,
    action: data.action,
    hostname: data.hostname,
  });

  return data.success === true && score >= RECAPTCHA_MIN_SCORE;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterPayload;
  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  const name = rawName ? sanitizeName(rawName) : "";
  const email = typeof body.email === "string" ? sanitizeEmail(body.email) : "";
  const phone = typeof body.phone === "string" ? sanitizePhone(body.phone) : "";
  const password = typeof body.password === "string" ? body.password : "";
  const dateOfBirthValue =
    typeof body.dateOfBirth === "string" ? body.dateOfBirth.trim() : "";
  const dateOfBirth = dateOfBirthValue ? new Date(dateOfBirthValue) : null;
  const source =
    typeof body.source === "string" && body.source.trim()
      ? body.source.trim()
      : "website";
  const sheetSource =
    source.toLowerCase() === "landing"
      ? "Landing Page Register"
      : "Website Register";

  if (!name || !email || !phone || !password) {
    return Response.json(
      { error: "Name, email, phone, and password are required." },
      { status: 400 },
    );
  }

  if (!hasValidPhoneFormat(phone)) {
    return Response.json(
      { error: "Please enter a valid phone number." },
      { status: 400 },
    );
  }

  if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
    return Response.json(
      { error: "Please enter a valid date of birth." },
      { status: 400 },
    );
  }

  if (wasSubmittedTooQuickly(body.formLoadTime)) {
    return registrationFailedResponse();
  }

  if (BOT_EMAIL_DOT_PATTERN.test(email)) {
    return registrationFailedResponse();
  }

  if (!/[aeiouAEIOU]/.test(name)) {
    return registrationFailedResponse();
  }

  if (name.length < 3 || !NAME_PATTERN.test(rawName)) {
    return Response.json(
      {
        error:
          "Name must be at least 3 characters and can only include letters, spaces, hyphens, and apostrophes.",
      },
      { status: 400 },
    );
  }

  const recaptchaToken =
    typeof body.recaptchaToken === "string" ? body.recaptchaToken.trim() : "";

  if (!recaptchaToken) {
    return registrationFailedResponse();
  }

  try {
    const isHuman = await verifyRecaptchaToken(recaptchaToken);

    if (!isHuman) {
      return registrationFailedResponse();
    }
  } catch (error) {
    console.error("Register reCAPTCHA verification failed:", error);
    return registrationFailedResponse();
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
      dateOfBirth,
      password: hashedPassword,
      role: "CLIENT",
      verificationToken,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      role: true,
    },
  });

  void appendToSheet({
    name,
    email,
    phone,
    dateOfBirth: dateOfBirthValue,
    source: sheetSource,
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
          <a href="https://selenitecare.com/verify-email?token=${verificationToken}" style="color: #B87B68;">
            https://selenitecare.com/verify-email?token=${verificationToken}
          </a>
        </p>
      </div>
    `,
  });

  return Response.json({ user }, { status: 201 });
}
