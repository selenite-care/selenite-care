import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { generateTransactionId, initializeEPSPayment } from "@/lib/eps";
import {
  getSetting,
  ONE_TIME_CONSULTATION_PRICE,
} from "@/lib/settings";

export const runtime = "nodejs";

type LandingConsultationPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  preferredDate?: unknown;
  doctorId?: unknown;
};

function parsePrice(value: string | null) {
  const price = parseFloat(value ?? "");
  return Number.isFinite(price) && price > 0 ? price : null;
}

function generateTemporaryPassword(phone: string) {
  return `SC${phone.replace(/\D/g, "")}`;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

function formatPreferredDate(date: Date) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function getConsultationEmailHtml({
  name,
  email,
  temporaryPassword,
  loginUrl,
  bookingToken,
  doctorName,
  preferredDate,
}: {
  name: string;
  email: string;
  temporaryPassword: string | null;
  loginUrl: string;
  bookingToken: string;
  doctorName: string;
  preferredDate: string;
}) {
  const credentialsHtml = temporaryPassword
    ? `
      <h2 style="margin-top: 24px; color: #2B2B2B;">Your Account Details</h2>
      <p>A Selenite Care client account has been created for you. Use the credentials below to log in:</p>
      <table style="border-collapse: collapse; margin: 16px 0; width: 100%; max-width: 560px;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD; font-weight: bold;">Login URL</td>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD;"><a href="${escapeHtml(loginUrl)}" style="color: #884F38;">${escapeHtml(loginUrl)}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD; font-weight: bold;">Email</td>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD;">${escapeHtml(email)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD; font-weight: bold;">Temporary Password</td>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD;">${escapeHtml(temporaryPassword)}</td>
        </tr>
      </table>
      <p><strong>Please change your password after first login.</strong></p>
    `
    : `
      <p>This booking has been linked to your existing Selenite Care account.</p>
      <p><a href="${escapeHtml(loginUrl)}" style="color: #884F38;">Log in to Selenite Care</a></p>
    `;

  return `
    <div style="font-family: Arial, sans-serif; color: #2B2B2B; line-height: 1.6;">
      <h1 style="color: #2B2B2B;">আপনার কনসালটেশন নিশ্চিত হয়েছে</h1>
      <p>Hello ${escapeHtml(name)},</p>
      <p>Your one-time consultation booking has been created successfully.</p>
      <table style="border-collapse: collapse; margin: 16px 0; width: 100%; max-width: 560px;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD; font-weight: bold;">Booking Token</td>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD;">${escapeHtml(bookingToken)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD; font-weight: bold;">Doctor</td>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD;">${escapeHtml(doctorName)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD; font-weight: bold;">Preferred Date</td>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD;">${escapeHtml(preferredDate)}</td>
        </tr>
      </table>
      ${credentialsHtml}
      <p>Our team will contact you within 24 hours to confirm your exact consultation time.</p>
      <p>
        Need help? Call us at
        <a href="tel:+8801647660300" style="color: #884F38;">+8801647660300</a>
        or message us on
        <a href="https://wa.me/8801647660300" style="color: #884F38;">WhatsApp</a>.
      </p>
    </div>
  `;
}

function parsePreferredDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  const preferredDate = new Date(value);
  return Number.isNaN(preferredDate.getTime()) ? null : preferredDate;
}

function getAppBaseUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin
  );
}

export async function POST(request: Request) {
  let bookingId: string | null = null;
  let createdUserId: string | null = null;

  try {
    const body = (await request.json().catch(() => null)) as
      | LandingConsultationPayload
      | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const phoneDigits = phone.replace(/\D/g, "");
    const doctorId =
      typeof body?.doctorId === "string" ? body.doctorId.trim() : "";
    const preferredDate = parsePreferredDate(body?.preferredDate);

    if (!name || !email || !phone || !doctorId || !preferredDate) {
      return Response.json(
        {
          error:
            "Name, email, phone, preferred date, and doctor are required.",
        },
        { status: 400 },
      );
    }

    if (!phoneDigits) {
      return Response.json(
        { error: "A valid phone number is required." },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return Response.json(
        { error: "A valid email address is required." },
        { status: 400 },
      );
    }

    const [doctor, existingUser, packagePrice] = await Promise.all([
      db.doctor.findFirst({
        where: {
          id: doctorId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      }),
      db.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      }),
      getSetting(ONE_TIME_CONSULTATION_PRICE).then(parsePrice),
    ]);

    if (!doctor) {
      return Response.json(
        { error: "Doctor not found or is not currently active." },
        { status: 404 },
      );
    }

    if (packagePrice === null) {
      return Response.json(
        { error: "One-time consultation price is not configured correctly." },
        { status: 500 },
      );
    }

    const appBaseUrl = getAppBaseUrl(request);
    let userId = existingUser?.id ?? null;
    let temporaryPassword: string | null = null;

    if (!userId) {
      temporaryPassword = generateTemporaryPassword(phone);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      const newUser = await db.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: "CLIENT",
          emailVerified: new Date(),
          isTemporaryPassword: true,
        },
        select: {
          id: true,
        },
      });
      userId = newUser.id;
      createdUserId = newUser.id;
    }

    const merchantTransactionId = generateTransactionId();
    const booking = await db.$transaction(async (tx) => {
      const existingBookings = await tx.booking.findMany({
        select: {
          doctorId: true,
          token: true,
        },
      });
      const usedTokens = new Set(
        existingBookings.map((existingBooking) => existingBooking.token),
      );
      const highestDoctorSerial = existingBookings.reduce(
        (highest, existingBooking) => {
          if (existingBooking.doctorId !== doctor.id) return highest;

          const serial = Number.parseInt(existingBooking.token, 10);
          return Number.isNaN(serial) ? highest : Math.max(highest, serial);
        },
        0,
      );
      let nextSerial = highestDoctorSerial + 1;
      let token = String(nextSerial).padStart(4, "0");

      while (usedTokens.has(token)) {
        nextSerial += 1;
        token = String(nextSerial).padStart(4, "0");
      }

      return tx.booking.create({
        data: {
          userId,
          doctorId: doctor.id,
          status: "PENDING",
          isOneTimeConsultation: true,
          appointmentTime: preferredDate,
          token,
          oneTimeConsultation: {
            create: {
              packagePrice,
              epsMerchantTxnId: merchantTransactionId,
            },
          },
        },
        select: {
          id: true,
          token: true,
        },
      });
    });
    bookingId = booking.id;

    const successUrl = `${appBaseUrl}/api/one-time-consultation/success`;
    const failUrl = `${appBaseUrl}/api/one-time-consultation/fail`;
    const cancelUrl = `${appBaseUrl}/api/one-time-consultation/cancel`;
    console.log("EPS callback URLs:", {
      successUrl,
      failUrl,
      cancelUrl,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });
    const payment = await initializeEPSPayment({
      merchantTransactionId,
      customerOrderId: `CONSULTATION-${booking.id}`,
      totalAmount: packagePrice,
      successUrl,
      failUrl,
      cancelUrl,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      productName: "One-Time Consultation \u2014 Selenite Care",
      valueA: booking.id,
      valueB: userId,
    });

    try {
      await sendEmail({
        to: email,
        subject: "আপনার কনসালটেশন নিশ্চিত হয়েছে — Selenite Care",
        html: getConsultationEmailHtml({
          name,
          email,
          temporaryPassword,
          loginUrl: "https://selenitecare.com/login",
          bookingToken: booking.token,
          doctorName: doctor.name,
          preferredDate: formatPreferredDate(preferredDate),
        }),
      });
    } catch (emailError) {
      console.error(
        "Landing consultation confirmation email failed:",
        emailError,
      );
    }

    return Response.json({ redirectUrl: payment.redirectUrl });
  } catch (error) {
    if (bookingId) {
      await db.booking.delete({ where: { id: bookingId } }).catch((cleanupError) => {
        console.error(
          "Failed to clean up landing consultation booking:",
          cleanupError,
        );
      });
    }

    if (createdUserId) {
      await db.user
        .delete({ where: { id: createdUserId } })
        .catch((cleanupError) => {
          console.error(
            "Failed to clean up landing consultation user:",
            cleanupError,
          );
        });
    }

    console.error("Landing consultation EPS initiation failed:", error);
    return Response.json(
      { error: "Unable to initiate one-time consultation payment." },
      { status: 500 },
    );
  }
}
