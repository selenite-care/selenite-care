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

function redirectToCart(
  request: Request,
  error: "payment_failed" | "payment_cancelled" | "payment_pending",
) {
  return NextResponse.redirect(new URL(`/cart?error=${error}`, request.url));
}

function redirectToSuccess(request: Request, merchantTransactionId: string) {
  const url = new URL(request.url);
  url.pathname = "/api/eps/order/success";
  url.searchParams.set("merchantTransactionId", merchantTransactionId);
  return NextResponse.redirect(url);
}

export async function handleUnsuccessfulOrderCallback(
  request: Request,
  outcome: UnsuccessfulOutcome,
) {
  const callbackMerchantTransactionId = getSearchValue(request, [
    "merchantTransactionId",
    "MerchantTransactionId",
    "merchant_transaction_id",
  ]);
  const orderId = getSearchValue(request, [
    "valueA",
    "ValueA",
    "orderId",
    "OrderId",
  ]);

  if (!callbackMerchantTransactionId && !orderId) {
    return redirectToCart(
      request,
      outcome === "failed" ? "payment_failed" : "payment_cancelled",
    );
  }

  try {
    const order = await db.order.findFirst({
      where: {
        ...(orderId ? { id: orderId } : {}),
        ...(callbackMerchantTransactionId
          ? { epsMerchantTxnId: callbackMerchantTransactionId }
          : {}),
      },
      select: {
        id: true,
        totalAmount: true,
        paymentStatus: true,
        epsMerchantTxnId: true,
      },
    });

    const merchantTransactionId = order?.epsMerchantTxnId;
    if (!order || !merchantTransactionId) {
      return redirectToCart(
        request,
        outcome === "failed" ? "payment_failed" : "payment_cancelled",
      );
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.redirect(
        new URL(
          `/orders/confirmation?orderId=${encodeURIComponent(order.id)}`,
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
      console.error(`EPS order ${outcome} verification was inconclusive:`, error);
      return redirectToCart(request, "payment_pending");
    }

    if (isVerifiedEPSPayment(verification, order.totalAmount)) {
      return redirectToSuccess(request, merchantTransactionId);
    }

    await db.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: "UNPAID",
      },
      data: {
        status: "CANCELLED",
        paymentStatus: "UNPAID",
        transactionRef: outcome === "failed" ? "EPS_FAILED" : "EPS_CANCELLED",
      },
    });

    return redirectToCart(
      request,
      outcome === "failed" ? "payment_failed" : "payment_cancelled",
    );
  } catch (error) {
    console.error(`EPS order ${outcome} handling failed:`, error);
    return redirectToCart(request, "payment_pending");
  }
}
