import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isVerifiedEPSPayment, verifyEPSPayment } from "@/lib/eps";

type UnsuccessfulOutcome = "failed" | "cancelled";

function getSearchValue(request: Request, keys: string[]) {
  const { searchParams } = new URL(request.url);

  for (const key of keys) {
    const value = searchParams.get(key)?.trim();
    if (value) return value;
  }

  return "";
}

function redirectToBooking(
  request: Request,
  error: "payment_failed" | "payment_cancelled" | "payment_pending",
) {
  const source = new URL(request.url).searchParams.get("source");
  if (source === "landing") {
    const landingUrl = new URL("/landing", request.url);
    landingUrl.searchParams.set("consultationPayment", error);
    landingUrl.hash = "online-video-consultation";
    return NextResponse.redirect(landingUrl);
  }

  return NextResponse.redirect(
    new URL(`/one-time-consultation?error=${error}`, request.url),
  );
}

function redirectToSuccess(
  request: Request,
  merchantTransactionId: string,
  bookingId: string,
) {
  const url = new URL(request.url);
  url.pathname = "/api/one-time-consultation/success";
  url.searchParams.set("merchantTransactionId", merchantTransactionId);
  url.searchParams.set("valueA", bookingId);
  return NextResponse.redirect(url);
}

export async function handleUnsuccessfulConsultationCallback(
  request: Request,
  outcome: UnsuccessfulOutcome,
) {
  const callbackMerchantTransactionId = getSearchValue(request, [
    "merchantTransactionId",
    "MerchantTransactionId",
    "MerchantTransactionID",
    "merchant_transaction_id",
  ]);
  const bookingId = getSearchValue(request, [
    "valueA",
    "ValueA",
    "bookingId",
  ]);

  if (!callbackMerchantTransactionId && !bookingId) {
    return redirectToBooking(
      request,
      "payment_failed",
    );
  }

  try {
    const consultation = await db.oneTimeConsultation.findFirst({
      where: {
        ...(bookingId ? { bookingId } : {}),
        ...(callbackMerchantTransactionId
          ? { epsMerchantTxnId: callbackMerchantTransactionId }
          : {}),
      },
      select: {
        bookingId: true,
        packagePrice: true,
        paymentStatus: true,
        epsMerchantTxnId: true,
      },
    });

    const merchantTransactionId = consultation?.epsMerchantTxnId;
    if (!consultation || !merchantTransactionId) {
      return redirectToBooking(
        request,
        "payment_failed",
      );
    }

    if (consultation.paymentStatus === "PAID") {
      return NextResponse.redirect(
        new URL(
          `/one-time-consultation/confirmation?bookingId=${encodeURIComponent(consultation.bookingId)}`,
          request.url,
        ),
      );
    }

    let verification: Record<string, unknown>;
    try {
      verification = (await verifyEPSPayment(
        merchantTransactionId,
      )) as Record<string, unknown>;
    } catch (error) {
      console.error(
        `EPS one-time consultation ${outcome} verification was inconclusive:`,
        error,
      );
      return redirectToBooking(request, "payment_pending");
    }

    if (isVerifiedEPSPayment(verification, consultation.packagePrice)) {
      return redirectToSuccess(
        request,
        merchantTransactionId,
        consultation.bookingId,
      );
    }

    await db.booking.updateMany({
      where: {
        id: consultation.bookingId,
        status: "PENDING",
        oneTimeConsultation: {
          is: {
            paymentStatus: "UNPAID",
          },
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    return redirectToBooking(
      request,
      "payment_failed",
    );
  } catch (error) {
    console.error(
      `EPS one-time consultation ${outcome} handling failed:`,
      error,
    );
    return redirectToBooking(request, "payment_pending");
  }
}
