import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function getMerchantTransactionId(request: Request) {
  const { searchParams } = new URL(request.url);

  return (
    searchParams.get("merchantTransactionId") ||
    searchParams.get("MerchantTransactionId") ||
    searchParams.get("merchant_transaction_id") ||
    ""
  ).trim();
}

export async function GET(request: Request) {
  const merchantTransactionId = getMerchantTransactionId(request);

  if (merchantTransactionId) {
    await db.order.updateMany({
      where: {
        epsMerchantTxnId: merchantTransactionId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });
  }

  return NextResponse.redirect(
    new URL("/cart?error=payment_cancelled", request.url),
  );
}
