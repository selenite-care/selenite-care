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

function redirectToPayment(request: Request, tier?: string) {
  const url = new URL("/membership/payment", request.url);
  url.searchParams.set("error", "payment_cancelled");
  url.searchParams.set("message", "Payment was cancelled");

  if (tier) {
    url.searchParams.set("tier", tier);
  }

  return NextResponse.redirect(url);
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
        membership: {
          select: {
            tier: true,
          },
        },
      },
    });

    if (payment) {
      await db.$transaction([
        db.membershipPayment.update({
          where: {
            id: payment.id,
          },
          data: {
            epsStatus: "Cancelled",
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
      return redirectToPayment(request, payment.membership.tier);
    }
  } catch (error) {
    console.error("EPS membership cancel handling failed:", error);
  }

  return redirectToPayment(request);
}
