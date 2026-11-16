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

function redirectToPayment(
  request: Request,
  error: "payment_failed" | "payment_cancelled" | "payment_pending",
  tier?: string,
) {
  const url = new URL("/membership/payment", request.url);
  if (tier) url.searchParams.set("tier", tier);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

function redirectToSuccess(request: Request, merchantTransactionId: string) {
  const url = new URL(request.url);
  url.pathname = "/api/eps/membership/success";
  url.searchParams.set("merchantTransactionId", merchantTransactionId);
  return NextResponse.redirect(url);
}

export async function handleUnsuccessfulMembershipCallback(
  request: Request,
  outcome: UnsuccessfulOutcome,
) {
  const callbackMerchantTransactionId = getSearchValue(request, [
    "merchantTransactionId",
    "MerchantTransactionId",
    "merchant_transaction_id",
  ]);
  const membershipId = getSearchValue(request, [
    "valueA",
    "ValueA",
    "membershipId",
    "MembershipId",
  ]);

  if (!callbackMerchantTransactionId && !membershipId) {
    return redirectToPayment(
      request,
      outcome === "failed" ? "payment_failed" : "payment_cancelled",
    );
  }

  try {
    const membership = await db.membership.findFirst({
      where: {
        ...(membershipId ? { membershipId } : {}),
        ...(callbackMerchantTransactionId
          ? {
              payment: {
                is: {
                  epsMerchantTxnId: callbackMerchantTransactionId,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        membershipId: true,
        tier: true,
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            epsMerchantTxnId: true,
          },
        },
      },
    });

    const payment = membership?.payment;
    const merchantTransactionId = payment?.epsMerchantTxnId;

    if (!membership || !payment || !merchantTransactionId) {
      return redirectToPayment(
        request,
        outcome === "failed" ? "payment_failed" : "payment_cancelled",
        membership?.tier,
      );
    }

    if (payment.status === "PAID") {
      return NextResponse.redirect(
        new URL(
          `/membership/welcome?id=${encodeURIComponent(membership.membershipId)}`,
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
        `EPS membership ${outcome} verification was inconclusive:`,
        error,
      );
      return redirectToPayment(request, "payment_pending", membership.tier);
    }

    if (isVerifiedEPSPayment(verification, payment.amount)) {
      return redirectToSuccess(request, merchantTransactionId);
    }

    await db.$transaction(async (tx) => {
      const markedPayment = await tx.membershipPayment.updateMany({
        where: {
          id: payment.id,
          status: "UNPAID",
        },
        data: {
          epsStatus: outcome === "failed" ? "FAILED" : "CANCELLED",
        },
      });

      if (markedPayment.count === 0) return;

      await tx.membership.updateMany({
        where: {
          id: membership.id,
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
        },
      });
    });

    return redirectToPayment(
      request,
      outcome === "failed" ? "payment_failed" : "payment_cancelled",
      membership.tier,
    );
  } catch (error) {
    console.error(`EPS membership ${outcome} handling failed:`, error);
    return redirectToPayment(request, "payment_pending");
  }
}
