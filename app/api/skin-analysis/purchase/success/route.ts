import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isVerifiedEPSPayment, verifyEPSPayment } from "@/lib/eps";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";

export const runtime = "nodejs";

type PendingPurchase = {
  merchantTransactionId?: string;
  userId?: string;
  quantity?: number;
  amount?: number;
  status?: string;
  createdAt?: string;
};

function buildRedirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

function getSearchValue(request: Request, keys: string[]) {
  const { searchParams } = new URL(request.url);

  for (const key of keys) {
    const value = searchParams.get(key)?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function getMerchantTransactionId(request: Request) {
  return getSearchValue(request, [
    "merchantTransactionId",
    "MerchantTransactionId",
    "MerchantTransactionID",
    "merchantTransactionID",
    "merchant_transaction_id",
    "merchantTxnId",
    "MerchantTxnId",
  ]);
}

function parsePendingPurchase(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as PendingPurchase;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const merchantTransactionId = getMerchantTransactionId(request);

  if (!merchantTransactionId) {
    return buildRedirect(request, "/skin-analysis?purchase_failed=true");
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
    const userId = pendingPurchase?.userId;
    const expectedAmount = pendingPurchase?.amount;

    if (
      !pendingSetting ||
      !pendingPurchase ||
      !userId ||
      typeof expectedAmount !== "number" ||
      !Number.isFinite(expectedAmount) ||
      expectedAmount <= 0
    ) {
      return buildRedirect(request, "/skin-analysis?purchase_failed=true");
    }

    if (pendingPurchase.status === "SUCCESS") {
      return buildRedirect(request, "/skin-analysis?purchased=true");
    }

    const verification = (await verifyEPSPayment(
      merchantTransactionId,
    )) as Record<string, unknown>;

    if (!isVerifiedEPSPayment(verification, expectedAmount)) {
      return buildRedirect(request, "/skin-analysis?purchase_failed=true");
    }

    const quantity = Math.min(
      10,
      Math.max(1, Math.floor(pendingPurchase.quantity ?? 0)),
    );

    const completedPurchase = JSON.stringify({
      ...pendingPurchase,
      merchantTransactionId,
      userId,
      quantity,
      amount: expectedAmount,
      status: "SUCCESS",
      completedAt: new Date().toISOString(),
    });
    const wasProcessed = await db.$transaction(async (tx) => {
      const claimedPurchase = await tx.appSetting.updateMany({
        where: {
          key: pendingKey,
          value: pendingSetting.value,
        },
        data: {
          value: completedPurchase,
          updatedBy: userId,
        },
      });

      if (claimedPurchase.count === 0) {
        return false;
      }

      await tx.skinAnalysisCredit.upsert({
        where: {
          userId,
        },
        update: {
          paidCredits: {
            increment: quantity,
          },
        },
        create: {
          userId,
          paidCredits: quantity,
        },
      });

      return true;
    });

    if (!wasProcessed) {
      return buildRedirect(request, "/skin-analysis?purchased=true");
    }

    await createNotification(
      userId,
      "Analysis Credits Added!",
      `${quantity} skin analysis credits added to your account. Go analyze your skin!`,
      NOTIFICATION_TYPES.SUCCESS,
      "/skin-analysis",
    ).catch((error) => {
      console.error("Skin analysis credit notification failed:", error);
    });

    return buildRedirect(request, "/skin-analysis?purchased=true");
  } catch (error) {
    console.error("EPS skin analysis purchase success handling failed:", error);
    return buildRedirect(request, "/skin-analysis?purchase_failed=true");
  }
}
