import { NextResponse } from "next/server";
import { formatAppointmentSchedule } from "@/lib/appointmentSchedule";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { isVerifiedEPSPayment, verifyEPSPayment } from "@/lib/eps";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { getSlotBlockingBookingWhere } from "@/lib/oneTimeConsultation";
import {
  sendFacebookCAPIEvent,
  sendGA4Event,
} from "@/lib/serverAnalytics";

export const runtime = "nodejs";

function buildRedirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

function buildPaymentErrorRedirect(
  request: Request,
  error: "payment_failed" | "payment_conflict" | "payment_pending",
) {
  const source = new URL(request.url).searchParams.get("source");
  if (source === "landing") {
    const url = new URL("/landing", request.url);
    url.searchParams.set("consultationPayment", error);
    url.hash = "online-video-consultation";
    return NextResponse.redirect(url);
  }

  return buildRedirect(request, `/one-time-consultation?error=${error}`);
}

function getSearchValue(request: Request, keys: string[]) {
  const { searchParams } = new URL(request.url);

  for (const key of keys) {
    const value = searchParams.get(key)?.trim();
    if (value) return value;
  }

  return "";
}

function getMerchantTransactionId(request: Request) {
  return getSearchValue(request, [
    "merchantTransactionId",
    "MerchantTransactionId",
    "MerchantTransactionID",
    "merchantTransactionID",
    "merchant_transaction_id",
    "merchantTxnId",
    "MerchantTxnId",
  ]);
}

function formatPreferredDate(date: Date | null) {
  if (!date) return "Not specified";

  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function getDhakaDayRange(date: Date) {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const start = new Date(`${dateKey}T00:00:00+06:00`);

  return {
    start,
    end: new Date(start.getTime() + 24 * 60 * 60 * 1000),
  };
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

function buildClientEmailHtml(input: {
  clientName: string;
  bookingToken: string;
  doctorName: string;
  preferredDate: string;
  amountPaid: number;
  email: string;
  temporaryPassword: string | null;
}) {
  const accountDetails = input.temporaryPassword
    ? `<p><strong>Your account:</strong> ${escapeHtml(input.email)}<br /><strong>Temporary password:</strong> ${escapeHtml(input.temporaryPassword)}<br />Please change your password after logging in at selenitecare.com/login.</p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; color: #2B2B2B; line-height: 1.6;">
      <h1 style="color: #2B2B2B;">One-Time Consultation Booked</h1>
      <p>Hello ${escapeHtml(input.clientName)},</p>
      <p>Your payment has been confirmed and your consultation request has been received.</p>
      <table style="border-collapse: collapse; margin: 16px 0; width: 100%; max-width: 560px;">
        <tr>
          <td style="padding: 10px 12px; border: 1px solid #EADDCD;">Booking Token</td>
          <td style="padding: 10px 12px; border: 1px solid #EADDCD;"><strong>${escapeHtml(input.bookingToken)}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; border: 1px solid #EADDCD;">Doctor</td>
          <td style="padding: 10px 12px; border: 1px solid #EADDCD;">${escapeHtml(input.doctorName)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; border: 1px solid #EADDCD;">Appointment Date &amp; Time</td>
          <td style="padding: 10px 12px; border: 1px solid #EADDCD;">${escapeHtml(input.preferredDate)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; border: 1px solid #EADDCD;">Amount Paid</td>
          <td style="padding: 10px 12px; border: 1px solid #EADDCD;">${escapeHtml(input.amountPaid.toLocaleString("en-US"))} BDT</td>
        </tr>
      </table>
      ${accountDetails}
      <p>Our team will contact you within 24 hours to confirm your exact consultation time. Contact: +8801647660300</p>
    </div>
  `;
}

export async function GET(request: Request) {
  const merchantTransactionId = getMerchantTransactionId(request);
  const bookingId = getSearchValue(request, ["valueA", "ValueA", "bookingId"]);
  const userId = getSearchValue(request, ["valueB", "ValueB", "userId"]);

  console.log("EPS one-time consultation callback:", {
    merchantTransactionId: merchantTransactionId || null,
    bookingId: bookingId || null,
    userId: userId || null,
    callbackUrl: request.url,
  });

  if (!merchantTransactionId) {
    return buildPaymentErrorRedirect(request, "payment_failed");
  }

  try {
    const consultation = await db.oneTimeConsultation.findFirst({
      where: {
        epsMerchantTxnId: merchantTransactionId,
        ...(bookingId ? { bookingId } : {}),
        booking: {
          isOneTimeConsultation: true,
          ...(userId ? { userId } : {}),
        },
      },
      select: {
        paymentStatus: true,
        paymentConflict: true,
        packagePrice: true,
        booking: {
          select: {
            id: true,
            userId: true,
            token: true,
            appointmentTime: true,
            timeSlot: true,
            doctorId: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
                isTemporaryPassword: true,
              },
            },
            doctor: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!consultation) {
      return buildPaymentErrorRedirect(request, "payment_failed");
    }

    if (consultation.paymentStatus === "PAID") {
      if (consultation.paymentConflict) {
        return buildPaymentErrorRedirect(request, "payment_conflict");
      }

      return buildRedirect(
        request,
        `/one-time-consultation/confirmation?bookingId=${encodeURIComponent(consultation.booking.id)}`,
      );
    }

    let verification: Record<string, unknown>;
    try {
      verification = (await verifyEPSPayment(
        merchantTransactionId,
      )) as Record<string, unknown>;
    } catch (verificationError) {
      console.error(
        "One-time consultation success verification was inconclusive:",
        verificationError,
      );
      return buildPaymentErrorRedirect(request, "payment_pending");
    }

    if (!isVerifiedEPSPayment(verification, consultation.packagePrice)) {
      await db.booking.updateMany({
        where: {
          id: consultation.booking.id,
          status: "PENDING",
          oneTimeConsultation: {
            is: { paymentStatus: "UNPAID" },
          },
        },
        data: { status: "CANCELLED" },
      });
      return buildPaymentErrorRedirect(request, "payment_failed");
    }

    const paymentOutcome = await db.$transaction(async (tx) => {
      const appointmentTime = consultation.booking.appointmentTime;
      const timeSlot = consultation.booking.timeSlot;
      const doctorId = consultation.booking.doctorId;
      let conflictingBookingId: string | null = null;

      if (appointmentTime && timeSlot && doctorId) {
        const { start, end } = getDhakaDayRange(appointmentTime);
        const conflictingBooking = await tx.booking.findFirst({
          where: {
            ...getSlotBlockingBookingWhere(),
            id: { not: consultation.booking.id },
            doctorId,
            timeSlot,
            appointmentTime: { gte: start, lt: end },
            status: { not: "CANCELLED" },
          },
          select: { id: true },
        });
        conflictingBookingId = conflictingBooking?.id ?? null;
      }

      const conflictNote = conflictingBookingId
        ? `Payment succeeded after the 15-minute hold expired, but booking ${conflictingBookingId} now occupies the selected slot.`
        : null;
      const claimedPayment = await tx.oneTimeConsultation.updateMany({
        where: {
          bookingId: consultation.booking.id,
          paymentStatus: "UNPAID",
        },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
          paymentConflict: Boolean(conflictingBookingId),
          paymentConflictNote: conflictNote,
        },
      });

      if (claimedPayment.count === 0) {
        const current = await tx.oneTimeConsultation.findUnique({
          where: { bookingId: consultation.booking.id },
          select: { paymentConflict: true },
        });
        return current?.paymentConflict ? "conflict" : "already-processed";
      }

      await tx.booking.update({
        where: { id: consultation.booking.id },
        data: {
          status: conflictingBookingId ? "CANCELLED" : "PENDING",
        },
      });

      return conflictingBookingId ? "conflict" : "confirmed";
    }, { isolationLevel: "Serializable" });

    if (paymentOutcome === "already-processed") {
      return buildRedirect(
        request,
        `/one-time-consultation/confirmation?bookingId=${encodeURIComponent(consultation.booking.id)}`,
      );
    }

    try {
      const analyticsUser = await db.user.findUnique({
        where: {
          id: consultation.booking.userId,
        },
        select: {
          name: true,
          email: true,
          phone: true,
        },
      });

      await Promise.allSettled([
        sendFacebookCAPIEvent({
          eventName: "Purchase",
          value: consultation.packagePrice,
          currency: "BDT",
          transactionId: consultation.booking.id,
          email: analyticsUser?.email ?? undefined,
          phone: analyticsUser?.phone ?? undefined,
          name: analyticsUser?.name ?? undefined,
        }),
        sendGA4Event({
          eventName: "purchase",
          value: consultation.packagePrice,
          currency: "BDT",
          transactionId: consultation.booking.id,
          items: [
            {
              item_id: "ONE_TIME_CONSULTATION",
              item_name: "Online Video Consultation - Selenite Care",
              price: consultation.packagePrice,
              item_category: "Consultation",
              quantity: 1,
            },
          ],
        }),
      ]);
    } catch (error) {
      console.error("One-time consultation analytics dispatch failed:", error);
    }

    const booking = consultation.booking;
    const clientName = booking.user.name || "Selenite Care Client";
    const doctorName = booking.doctor?.name || "Selenite Care Doctor";
    const preferredDate =
      booking.appointmentTime && booking.timeSlot
        ? formatAppointmentSchedule(
            booking.appointmentTime,
            booking.timeSlot,
          )
        : formatPreferredDate(booking.appointmentTime);
    const contactPhone = booking.user.phone || "Not provided";
    const staffUsers = await db.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "CRM"],
        },
      },
      select: {
        id: true,
      },
    });

    if (paymentOutcome === "conflict") {
      const conflictMessage = `${clientName}'s payment was received after the 15-minute slot hold expired, and the selected slot is now occupied. Booking ${booking.token} requires manual review. Contact: ${contactPhone}.`;
      const adminUsers = await db.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      });

      await Promise.allSettled(
        adminUsers.map((admin) =>
          createNotification(
            admin.id,
            "Paid Consultation Slot Conflict",
            conflictMessage,
            NOTIFICATION_TYPES.BOOKING,
            "/admin/one-time-consultations",
          ),
        ),
      );

      return buildPaymentErrorRedirect(request, "payment_conflict");
    }

    const staffMessage = `${clientName} has booked a one-time consultation with ${doctorName}. Preferred date: ${preferredDate}. Contact: ${contactPhone}. Confirm time via phone.`;
    const communicationResults = await Promise.allSettled([
      sendEmail({
        to: booking.user.email,
        subject: "One-Time Consultation Booked \u2014 Selenite Care",
        html: buildClientEmailHtml({
          clientName,
          bookingToken: booking.token,
          doctorName,
          preferredDate,
          amountPaid: consultation.packagePrice,
          email: booking.user.email,
          temporaryPassword:
            booking.user.isTemporaryPassword && booking.user.phone
              ? `SC${booking.user.phone.replace(/\D/g, "")}`
              : null,
        }),
      }),
      ...staffUsers.map((staffUser) =>
        createNotification(
          staffUser.id,
          "New One-Time Consultation Payment",
          staffMessage,
          NOTIFICATION_TYPES.BOOKING,
          "/admin/one-time-consultations",
        ),
      ),
    ]);

    communicationResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error(
          "One-time consultation communication failed:",
          result.reason,
        );
      }
    });

    return buildRedirect(
      request,
      `/one-time-consultation/confirmation?bookingId=${encodeURIComponent(consultation.booking.id)}`,
    );
  } catch (error) {
    console.error("One-time consultation success callback failed:", error);
    return buildPaymentErrorRedirect(request, "payment_pending");
  }
}
