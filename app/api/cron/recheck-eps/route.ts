import { db } from "@/lib/db";
import {
  applyEPSPaymentSuccess,
  type EPSRecheckType,
} from "@/lib/epsRecheck";

export const runtime = "nodejs";
export const maxDuration = 300;

type RecheckTarget = {
  type: EPSRecheckType;
  recordId: string;
  merchantTransactionId: string;
};

type PendingSkinPurchase = {
  merchantTransactionId?: string;
  status?: string;
};

const RECHECK_WINDOW_MS = 48 * 60 * 60 * 1000;
const RECHECK_CONCURRENCY = 4;

function parsePendingSkinPurchase(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value) as PendingSkinPurchase;
  } catch {
    return null;
  }
}

async function wasPaymentApplied(target: RecheckTarget) {
  switch (target.type) {
    case "membership": {
      const payment = await db.membershipPayment.findUnique({
        where: { id: target.recordId },
        select: { status: true },
      });
      return payment?.status === "PAID";
    }
    case "order": {
      const order = await db.order.findUnique({
        where: { id: target.recordId },
        select: { paymentStatus: true },
      });
      return order?.paymentStatus === "PAID";
    }
    case "consultation": {
      const consultation = await db.oneTimeConsultation.findUnique({
        where: { id: target.recordId },
        select: { paymentStatus: true },
      });
      return consultation?.paymentStatus === "PAID";
    }
    case "skin-analysis": {
      const setting = await db.appSetting.findUnique({
        where: { key: target.recordId },
        select: { value: true },
      });
      return parsePendingSkinPurchase(setting?.value ?? null)?.status === "SUCCESS";
    }
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RECHECK_WINDOW_MS);

  try {
    const [membershipPayments, orders, consultations, skinPurchaseSettings] =
      await Promise.all([
        db.membershipPayment.findMany({
          where: {
            status: "UNPAID",
            createdAt: { gte: cutoff },
            epsMerchantTxnId: { not: null },
            OR: [{ epsStatus: null }, { epsStatus: { not: "Superseded" } }],
          },
          select: { id: true, epsMerchantTxnId: true },
          orderBy: { createdAt: "asc" },
        }),
        db.order.findMany({
          where: {
            paymentStatus: "UNPAID",
            createdAt: { gte: cutoff },
            epsMerchantTxnId: { not: null },
          },
          select: { id: true, epsMerchantTxnId: true },
          orderBy: { createdAt: "asc" },
        }),
        db.oneTimeConsultation.findMany({
          where: {
            paymentStatus: "UNPAID",
            createdAt: { gte: cutoff },
            epsMerchantTxnId: { not: null },
          },
          select: { id: true, epsMerchantTxnId: true },
          orderBy: { createdAt: "asc" },
        }),
        db.appSetting.findMany({
          where: {
            key: { startsWith: "skin_analysis_purchase_" },
            updatedAt: { gte: cutoff },
          },
          select: { key: true, value: true },
          orderBy: { updatedAt: "asc" },
        }),
      ]);

    const targets: RecheckTarget[] = [
      ...membershipPayments.flatMap((payment) =>
        payment.epsMerchantTxnId
          ? [{
              type: "membership" as const,
              recordId: payment.id,
              merchantTransactionId: payment.epsMerchantTxnId,
            }]
          : [],
      ),
      ...orders.flatMap((order) =>
        order.epsMerchantTxnId
          ? [{
              type: "order" as const,
              recordId: order.id,
              merchantTransactionId: order.epsMerchantTxnId,
            }]
          : [],
      ),
      ...consultations.flatMap((consultation) =>
        consultation.epsMerchantTxnId
          ? [{
              type: "consultation" as const,
              recordId: consultation.id,
              merchantTransactionId: consultation.epsMerchantTxnId,
            }]
          : [],
      ),
      ...skinPurchaseSettings.flatMap((setting) => {
        const purchase = parsePendingSkinPurchase(setting.value);

        return purchase?.status === "PENDING" && purchase.merchantTransactionId
          ? [{
              type: "skin-analysis" as const,
              recordId: setting.key,
              merchantTransactionId: purchase.merchantTransactionId,
            }]
          : [];
      }),
    ];

    let paymentsApplied = 0;
    let stillUnpaid = 0;

    for (let index = 0; index < targets.length; index += RECHECK_CONCURRENCY) {
      const batch = targets.slice(index, index + RECHECK_CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (target) => {
          try {
            await applyEPSPaymentSuccess(
              target.type,
              target.merchantTransactionId,
              new URL(request.url).origin,
            );
            return await wasPaymentApplied(target);
          } catch (error) {
            console.error(
              `Scheduled EPS re-check failed for ${target.merchantTransactionId}:`,
              error,
            );
            return false;
          }
        }),
      );

      paymentsApplied += results.filter(Boolean).length;
      stillUnpaid += results.filter((result) => !result).length;
    }

    console.info(
      `EPS re-check processed ${targets.length} attempts: ${paymentsApplied} paid, ${stillUnpaid} still unpaid.`,
    );

    return Response.json({
      success: true,
      attemptsFound: targets.length,
      paymentsApplied,
      stillUnpaid,
      windowHours: 48,
    });
  } catch (error) {
    console.error("Failed to run scheduled EPS re-checks:", error);
    return Response.json(
      { error: "Failed to run scheduled EPS re-checks." },
      { status: 500 },
    );
  }
}
