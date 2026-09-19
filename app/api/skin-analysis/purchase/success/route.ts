import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyEPSPayment } from "@/lib/eps";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { updateSetting } from "@/lib/settings";

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

function getUserId(request: Request) {
  return getSearchValue(request, ["valueA", "ValueA", "userId", "UserId"]);
}

function getQuantity(request: Request) {
  const rawQuantity = getSearchValue(request, [
    "valueB",
    "ValueB",
    "quantity",
    "Quantity",
  ]);
  const quantity = Number.parseInt(rawQuantity, 10);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 1;
  }

  return Math.min(10, quantity);
}

function isEPSSuccess(data: Record<string, unknown>) {
  return (
    data.status === "Success" ||
    data.Status === "Success" ||
    data.transactionStatus === "Success" ||
    data.TransactionStatus === "Success" ||
    data.statusCode === "200" ||
    data.isSuccess === true
  );
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
  const queryUserId = getUserId(request);
  const queryQuantity = getQuantity(request);

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
    const userId = pendingPurchase?.userId || queryUserId;

    if (!userId) {
      return buildRedirect(request, "/skin-analysis?purchase_failed=true");
    }

    const verification = (await verifyEPSPayment(
      merchantTransactionId,
    )) as Record<string, unknown>;

    if (!isEPSSuccess(verification)) {
      return buildRedirect(request, "/skin-analysis?purchase_failed=true");
    }

    const quantity = Math.min(
      10,
      Math.max(1, Math.floor(pendingPurchase?.quantity ?? queryQuantity)),
    );

    if (pendingPurchase?.status === "SUCCESS") {
      return buildRedirect(request, "/skin-analysis?purchased=true");
    }

    await db.skinAnalysisCredit.upsert({
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

    await Promise.allSettled([
      createNotification(
        userId,
        "Analysis Credits Added!",
        `${quantity} skin analysis credits added to your account. Go analyze your skin!`,
        NOTIFICATION_TYPES.SUCCESS,
        "/skin-analysis",
      ),
      updateSetting(
        pendingKey,
        JSON.stringify({
          ...pendingPurchase,
          merchantTransactionId,
          userId,
          quantity,
          status: "SUCCESS",
          completedAt: new Date().toISOString(),
        }),
        userId,
      ),
    ]);

    return buildRedirect(request, "/skin-analysis?purchased=true");
  } catch (error) {
    console.error("EPS skin analysis purchase success handling failed:", error);
    return buildRedirect(request, "/skin-analysis?purchase_failed=true");
  }
}
