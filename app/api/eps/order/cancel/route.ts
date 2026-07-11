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

function getOrderId(request: Request) {
  const { searchParams } = new URL(request.url);

  return (
    searchParams.get("valueA") ||
    searchParams.get("ValueA") ||
    searchParams.get("orderId") ||
    searchParams.get("OrderId") ||
    ""
  ).trim();
}

export async function GET(request: Request) {
  const merchantTransactionId = getMerchantTransactionId(request);
  const orderId = getOrderId(request);

  if (merchantTransactionId || orderId) {
    const order = await db.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(merchantTransactionId
            ? [{ epsMerchantTxnId: merchantTransactionId }]
            : []),
        ],
      },
      select: {
        id: true,
      },
    });

    if (order) {
      await db.$transaction([
        db.orderItem.deleteMany({
          where: {
            orderId: order.id,
          },
        }),
        db.order.deleteMany({
          where: {
            id: order.id,
          },
        }),
      ]);
    }
  }

  return NextResponse.redirect(
    new URL("/cart?error=payment_cancelled", request.url),
  );
}
