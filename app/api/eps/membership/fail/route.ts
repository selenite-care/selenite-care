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

function redirectToPayment(request: Request) {
  return NextResponse.redirect(
    new URL(
      "/membership/payment?error=payment_failed&message=Payment+failed+please+try+again",
      request.url,
    ),
  );
}

export async function GET(request: Request) {
  const merchantTransactionId = getMerchantTransactionId(request);

  if (!merchantTransactionId) {
    return redirectToPayment(request);
  }

  try {
    const payment = await db.membershipPayment.findUnique({
      where: {
        epsMerchantTxnId: merchantTransactionId,
      },
      select: {
        id: true,
        membershipId: true,
      },
    });

    if (payment) {
      await db.$transaction([
        db.membershipPayment.update({
          where: {
            id: payment.id,
          },
          data: {
            epsStatus: "Failed",
          },
        }),
        db.membership.update({
          where: {
            id: payment.membershipId,
          },
          data: {
            status: "CANCELLED",
          },
        }),
      ]);
    }
  } catch (error) {
    console.error("EPS membership fail handling failed:", error);
  }

  return redirectToPayment(request);
}
