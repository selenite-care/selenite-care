import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { generateTransactionId, initializeEPSPayment } from "@/lib/eps";
import { getSetting } from "@/lib/settings";

export const runtime = "nodejs";

const DEFAULT_CONSULTATION_PRICE = 99;
const TEMPORARY_PASSWORD_LENGTH = 8;
const TEMPORARY_PASSWORD_CHARACTERS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

type LandingConsultationPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  preferredDate?: unknown;
  doctorId?: unknown;
};

function parsePrice(value: string | null) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0
    ? price
    : DEFAULT_CONSULTATION_PRICE;
}

function generateTemporaryPassword() {
  let password = "";

  for (let index = 0; index < TEMPORARY_PASSWORD_LENGTH; index += 1) {
    password +=
      TEMPORARY_PASSWORD_CHARACTERS[
        randomInt(TEMPORARY_PASSWORD_CHARACTERS.length)
      ];
  }

  return password;
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

function getWelcomeEmailHtml({
  name,
  email,
  temporaryPassword,
  loginUrl,
}: {
  name: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #2B2B2B; line-height: 1.6;">
      <h1 style="color: #2B2B2B;">Welcome to Selenite Care</h1>
      <p>Hello ${escapeHtml(name)},</p>
      <p>Your client account has been created for your one-time consultation.</p>
      <p>You can log in using the credentials below:</p>
      <table style="border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD; font-weight: bold;">Email</td>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD;">${escapeHtml(email)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD; font-weight: bold;">Temporary Password</td>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD;">${escapeHtml(temporaryPassword)}</td>
        </tr>
      </table>
      <p style="margin-top: 16px;">Please change your password after logging in.</p>
      <p>
        <a href="${escapeHtml(loginUrl)}" style="color: #884F38;">Log in to Selenite Care</a>
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

  try {
    const body = (await request.json().catch(() => null)) as
      | LandingConsultationPayload
      | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
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
      getSetting("one_time_consultation_price").then(parsePrice),
    ]);

    if (!doctor) {
      return Response.json(
        { error: "Doctor not found or is not currently active." },
        { status: 404 },
      );
    }

    const appBaseUrl = getAppBaseUrl(request);
    let userId = existingUser?.id ?? null;

    if (!userId) {
      const temporaryPassword = generateTemporaryPassword();
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

      try {
        await sendEmail({
          to: email,
          subject: "Welcome to Selenite Care - Your Login Credentials",
          html: getWelcomeEmailHtml({
            name,
            email,
            temporaryPassword,
            loginUrl: `${appBaseUrl}/login`,
          }),
        });
      } catch (emailError) {
        await db.user.delete({ where: { id: newUser.id } }).catch(() => undefined);
        throw emailError;
      }
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

    console.error("Landing consultation EPS initiation failed:", error);
    return Response.json(
      { error: "Unable to initiate one-time consultation payment." },
      { status: 500 },
    );
  }
}
