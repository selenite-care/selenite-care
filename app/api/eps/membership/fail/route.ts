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

function getMembershipId(request: Request) {
  const { searchParams } = new URL(request.url);

  return (
    searchParams.get("valueA") ||
    searchParams.get("ValueA") ||
    searchParams.get("membershipId") ||
    searchParams.get("MembershipId") ||
    ""
  ).trim();
}

function redirectToPayment(request: Request, tier?: string) {
  const url = new URL("/membership/payment", request.url);
  if (tier) {
    url.searchParams.set("tier", tier);
  }
  url.searchParams.set("error", "payment_failed");

  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const merchantTransactionId = getMerchantTransactionId(request);
  const membershipId = getMembershipId(request);

  if (!merchantTransactionId && !membershipId) {
    return redirectToPayment(request);
  }

  try {
    const membership = await db.membership.findFirst({
      where: {
        OR: [
          ...(membershipId ? [{ membershipId }] : []),
          ...(merchantTransactionId
            ? [
                {
                  payment: {
                    is: {
                      epsMerchantTxnId: merchantTransactionId,
                    },
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        tier: true,
      },
    });

    if (membership) {
      await db.$transaction([
        db.membershipPayment.deleteMany({
          where: {
            membershipId: membership.id,
          },
        }),
        db.membership.deleteMany({
          where: {
            id: membership.id,
          },
        }),
      ]);
      return redirectToPayment(request, membership.tier);
    }
  } catch (error) {
    console.error("EPS membership fail handling failed:", error);
  }

  return redirectToPayment(request);
}
