import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { verifyEPSPayment } from "@/lib/eps";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";

export const runtime = "nodejs";

function buildRedirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
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
    "merchant_transaction_id",
  ]);
}

function isEPSSuccess(data: Record<string, unknown>) {
  return (
    data.status === "Success" ||
    data.Status === "Success" ||
    data.transactionStatus === "Success" ||
    data.TransactionStatus === "Success" ||
    data.statusCode === "200" ||
    data.isSuccess === true
  );
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
}) {
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
          <td style="padding: 10px 12px; border: 1px solid #EADDCD;">Preferred Date</td>
          <td style="padding: 10px 12px; border: 1px solid #EADDCD;">${escapeHtml(input.preferredDate)}</td>
        </tr>
      </table>
      <p>Our team will contact you within 24 hours to confirm your exact consultation time. Contact: +8801647660300</p>
    </div>
  `;
}

export async function GET(request: Request) {
  const merchantTransactionId = getMerchantTransactionId(request);
  const bookingId = getSearchValue(request, ["valueA", "ValueA", "bookingId"]);
  const userId = getSearchValue(request, ["valueB", "ValueB", "userId"]);

  if (!merchantTransactionId || !bookingId || !userId) {
    return buildRedirect(
      request,
      "/one-time-consultation?error=payment_failed",
    );
  }

  try {
    const verification = (await verifyEPSPayment(
      merchantTransactionId,
    )) as Record<string, unknown>;

    if (!isEPSSuccess(verification)) {
      return buildRedirect(
        request,
        "/one-time-consultation?error=payment_failed",
      );
    }

    const consultation = await db.oneTimeConsultation.findFirst({
      where: {
        bookingId,
        epsMerchantTxnId: merchantTransactionId,
        booking: {
          userId,
          isOneTimeConsultation: true,
        },
      },
      select: {
        paymentStatus: true,
        booking: {
          select: {
            id: true,
            token: true,
            appointmentTime: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
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
      return buildRedirect(
        request,
        "/one-time-consultation?error=payment_failed",
      );
    }

    if (consultation.paymentStatus !== "PAID") {
      await db.oneTimeConsultation.update({
        where: {
          bookingId,
        },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
        },
      });

      const booking = consultation.booking;
      const clientName = booking.user.name || "Selenite Care Client";
      const doctorName = booking.doctor?.name || "Selenite Care Doctor";
      const preferredDate = formatPreferredDate(booking.appointmentTime);
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
    }

    return buildRedirect(
      request,
      `/one-time-consultation/confirmation?bookingId=${encodeURIComponent(bookingId)}`,
    );
  } catch (error) {
    console.error("One-time consultation success callback failed:", error);
    return buildRedirect(
      request,
      "/one-time-consultation?error=payment_failed",
    );
  }
}
