import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { appendToSheet } from "@/lib/googleSheets";
import { sanitizeEmail, sanitizeName, sanitizePhone, sanitizeText } from "@/lib/sanitize";

type LeadPayload = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  interest?: unknown;
  website?: unknown;
  url?: unknown;
};

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 3;
const leadSubmissionAttempts = new Map<string, number[]>();

function genericSuccessResponse() {
  return Response.json({
    ok: true,
    message: "Your details have been submitted successfully.",
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return (
    firstForwardedIp ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function hasHoneypotValue(value: unknown) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function hasRandomMixedCaseName(value: string) {
  if (value.length <= 20 || /\s/.test(value)) {
    return false;
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) {
    return false;
  }

  const letters = value.replace(/[^a-z]/gi, "");
  let caseSwitches = 0;

  for (let index = 1; index < letters.length; index += 1) {
    const current = letters[index];
    const previous = letters[index - 1];

    if (
      current.toLowerCase() !== current &&
      previous.toLowerCase() === previous
    ) {
      caseSwitches += 1;
    } else if (
      current.toLowerCase() === current &&
      previous.toLowerCase() !== previous
    ) {
      caseSwitches += 1;
    }
  }

  return caseSwitches >= 6;
}

function hasBotEmailPattern(value: string) {
  return /(\w\.){3,}/.test(value);
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recentAttempts = (leadSubmissionAttempts.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recentAttempts.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
    leadSubmissionAttempts.set(ip, recentAttempts);
    return true;
  }

  leadSubmissionAttempts.set(ip, [...recentAttempts, now]);
  return false;
}

export async function POST(request: Request) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();

  if (!adminEmail) {
    return Response.json(
      { error: "ADMIN_EMAIL is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as LeadPayload | null;

  if (
    hasHoneypotValue(body?.website) ||
    hasHoneypotValue(body?.url)
  ) {
    return genericSuccessResponse();
  }

  if (isRateLimited(getRequestIp(request))) {
    return genericSuccessResponse();
  }

  const name = typeof body?.name === "string" ? sanitizeName(body.name) : "";
  const phone = typeof body?.phone === "string" ? sanitizePhone(body.phone) : "";
  const email = typeof body?.email === "string" ? sanitizeEmail(body.email) : "";
  const interest =
    typeof body?.interest === "string" ? sanitizeText(body.interest) : "";

  if (hasRandomMixedCaseName(name) || (email && hasBotEmailPattern(email))) {
    return genericSuccessResponse();
  }

  if (!phone && !email) {
    return Response.json(
      { error: "Please provide either your phone number or email address." },
      { status: 400 },
    );
  }

  if (email && !email.includes("@")) {
    return Response.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  const lead = await db.leadCapture.create({
    data: {
      name: name || "Marketing Lead",
      phone,
      email: email || null,
      interest: interest || null,
    },
  });

  void appendToSheet({
    name: name || "Marketing Lead",
    email: email || "Not provided",
    phone,
    dateOfBirth: null,
    source: "Landing Page Lead",
  });

  const submittedAt = lead.createdAt.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  });

  const html = `
    <div style="font-family: Arial, sans-serif; color: #2B2B2B; line-height: 1.6;">
      <h2 style="margin-bottom: 16px;">New Lead from Landing Page - Selenite Care</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #EADDCD; font-weight: bold;">Name</td>
            <td style="padding: 10px; border: 1px solid #EADDCD;">${name ? escapeHtml(name) : "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #EADDCD; font-weight: bold;">Phone</td>
            <td style="padding: 10px; border: 1px solid #EADDCD;">${phone ? escapeHtml(phone) : "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #EADDCD; font-weight: bold;">Email</td>
            <td style="padding: 10px; border: 1px solid #EADDCD;">${email ? escapeHtml(email) : "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #EADDCD; font-weight: bold;">Interest</td>
            <td style="padding: 10px; border: 1px solid #EADDCD;">${interest ? escapeHtml(interest) : "Not specified"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #EADDCD; font-weight: bold;">Submitted At</td>
            <td style="padding: 10px; border: 1px solid #EADDCD;">${escapeHtml(submittedAt)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    await sendEmail({
      to: adminEmail,
      subject: "New Lead from Landing Page - Selenite Care",
      html,
    });
  } catch (error) {
    console.error("Landing lead email failed:", error);
    return Response.json(
      {
        error:
          "Lead was saved, but the admin notification email could not be sent.",
      },
      { status: 500 },
    );
  }

  return genericSuccessResponse();
}
