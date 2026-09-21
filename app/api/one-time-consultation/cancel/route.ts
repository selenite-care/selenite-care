import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function getSearchValue(request: Request, keys: string[]) {
  const { searchParams } = new URL(request.url);

  for (const key of keys) {
    const value = searchParams.get(key)?.trim();
    if (value) return value;
  }

  return "";
}

export async function GET(request: Request) {
  const bookingId = getSearchValue(request, ["valueA", "ValueA", "bookingId"]);
  const merchantTransactionId = getSearchValue(request, [
    "merchantTransactionId",
    "MerchantTransactionId",
    "MerchantTransactionID",
    "merchant_transaction_id",
  ]);

  if (merchantTransactionId) {
    try {
      const consultation = await db.oneTimeConsultation.findFirst({
        where: {
          paymentStatus: "UNPAID",
          epsMerchantTxnId: merchantTransactionId,
          ...(bookingId ? { bookingId } : {}),
        },
        select: {
          bookingId: true,
        },
      });

      if (consultation) {
        await db.$transaction([
          db.oneTimeConsultation.delete({
            where: { bookingId: consultation.bookingId },
          }),
          db.booking.delete({ where: { id: consultation.bookingId } }),
        ]);
      }
    } catch (error) {
      console.error("One-time consultation cancellation cleanup failed:", error);
    }
  }

  return NextResponse.redirect(
    new URL("/one-time-consultation?error=payment_failed", request.url),
  );
}
