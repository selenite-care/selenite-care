import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isVerifiedEPSPayment, verifyEPSPayment } from "@/lib/eps";

type UnsuccessfulOutcome = "failed" | "cancelled";

type PendingPurchase = {
  merchantTransactionId?: string;
  userId?: string;
  quantity?: number;
  amount?: number;
  status?: string;
  createdAt?: string;
};

function getMerchantTransactionId(request: Request) {
  const { searchParams } = new URL(request.url);

  for (const key of [
    "merchantTransactionId",
    "MerchantTransactionId",
    "MerchantTransactionID",
    "merchantTransactionID",
    "merchant_transaction_id",
    "merchantTxnId",
    "MerchantTxnId",
  ]) {
    const value = searchParams.get(key)?.trim();
    if (value) return value;
  }

  return "";
}

function parsePendingPurchase(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value) as PendingPurchase;
  } catch {
    return null;
  }
}

function redirectToAnalysis(
  request: Request,
  outcome: UnsuccessfulOutcome | "pending",
) {
  const path =
    outcome === "pending"
      ? "/skin-analysis?purchase_pending=true"
      : outcome === "failed"
        ? "/skin-analysis?purchase_failed=true&reason=failed"
        : "/skin-analysis?purchase_cancelled=true";

  return NextResponse.redirect(new URL(path, request.url));
}

function redirectToSuccess(request: Request, merchantTransactionId: string) {
  const url = new URL(request.url);
  url.pathname = "/api/skin-analysis/purchase/success";
  url.searchParams.set("merchantTransactionId", merchantTransactionId);
  return NextResponse.redirect(url);
}

export async function handleUnsuccessfulSkinCreditCallback(
  request: Request,
  outcome: UnsuccessfulOutcome,
) {
  const merchantTransactionId = getMerchantTransactionId(request);

  if (!merchantTransactionId) {
    return redirectToAnalysis(request, outcome);
  }

  const pendingKey = `skin_analysis_purchase_${merchantTransactionId}`;

  try {
    const pendingSetting = await db.appSetting.findUnique({
      where: {
        key: pendingKey,
      },
      select: {
        value: true,
      },
    });
    const pendingPurchase = parsePendingPurchase(pendingSetting?.value ?? null);
    const expectedAmount = pendingPurchase?.amount;

    if (!pendingSetting || !pendingPurchase) {
      return redirectToAnalysis(request, outcome);
    }

    if (pendingPurchase.status === "SUCCESS") {
      return NextResponse.redirect(
        new URL("/skin-analysis?purchased=true", request.url),
      );
    }

    if (
      typeof expectedAmount !== "number" ||
      !Number.isFinite(expectedAmount) ||
      expectedAmount <= 0
    ) {
      return redirectToAnalysis(request, "pending");
    }

    let verification: Record<string, unknown>;
    try {
      verification = (await verifyEPSPayment(
        merchantTransactionId,
      )) as Record<string, unknown>;
    } catch (error) {
      console.error(
        `EPS skin analysis credit ${outcome} verification was inconclusive:`,
        error,
      );
      return redirectToAnalysis(request, "pending");
    }

    if (isVerifiedEPSPayment(verification, expectedAmount)) {
      return redirectToSuccess(request, merchantTransactionId);
    }

    await db.appSetting.updateMany({
      where: {
        key: pendingKey,
        value: pendingSetting.value,
      },
      data: {
        value: JSON.stringify({
          ...pendingPurchase,
          status: outcome === "failed" ? "FAILED" : "CANCELLED",
          completedAt: new Date().toISOString(),
        }),
      },
    });

    return redirectToAnalysis(request, outcome);
  } catch (error) {
    console.error(`EPS skin analysis credit ${outcome} handling failed:`, error);
    return redirectToAnalysis(request, "pending");
  }
}
