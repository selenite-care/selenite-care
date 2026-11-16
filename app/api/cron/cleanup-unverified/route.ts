import { db } from "@/lib/db";

export const runtime = "nodejs";

type RecheckTarget = {
  path: string;
  merchantTransactionId: string;
  valueA?: string;
};

const MAX_RECHECKS_PER_TYPE = 10;
const RECHECK_CONCURRENCY = 5;

function parsePendingSkinPurchase(value: string) {
  try {
    return JSON.parse(value) as {
      merchantTransactionId?: string;
      status?: string;
    };
  } catch {
    return null;
  }
}

function buildRecheckUrl(baseUrl: string, target: RecheckTarget) {
  const url = new URL(target.path, baseUrl);
  url.searchParams.set(
    "merchantTransactionId",
    target.merchantTransactionId,
  );
  if (target.valueA) url.searchParams.set("valueA", target.valueA);
  return url;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appBaseUrl) {
    return Response.json(
      { error: "NEXT_PUBLIC_APP_URL is not configured." },
      { status: 500 },
    );
  }

  const recheckCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);

  try {
    const [membershipPayments, orders, consultations, skinPurchaseSettings] =
      await Promise.all([
        db.membershipPayment.findMany({
          where: {
            status: "UNPAID",
            createdAt: { lt: recheckCutoff },
            epsMerchantTxnId: { not: null },
            OR: [
              { epsStatus: null },
              { epsStatus: { notIn: ["FAILED", "CANCELLED", "Superseded"] } },
            ],
            membership: {
              is: {
                status: "PENDING",
              },
            },
          },
          select: {
            epsMerchantTxnId: true,
            membership: {
              select: {
                membershipId: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
          take: MAX_RECHECKS_PER_TYPE,
        }),
        db.order.findMany({
          where: {
            paymentStatus: "UNPAID",
            status: "PENDING",
            createdAt: { lt: recheckCutoff },
            epsMerchantTxnId: { not: null },
          },
          select: {
            id: true,
            epsMerchantTxnId: true,
          },
          orderBy: { createdAt: "asc" },
          take: MAX_RECHECKS_PER_TYPE,
        }),
        db.oneTimeConsultation.findMany({
          where: {
            paymentStatus: "UNPAID",
            createdAt: { lt: recheckCutoff },
            epsMerchantTxnId: { not: null },
            booking: {
              status: "PENDING",
            },
          },
          select: {
            bookingId: true,
            epsMerchantTxnId: true,
          },
          orderBy: { createdAt: "asc" },
          take: MAX_RECHECKS_PER_TYPE,
        }),
        db.appSetting.findMany({
          where: {
            key: { startsWith: "skin_analysis_purchase_" },
            updatedAt: { lt: recheckCutoff },
          },
          select: {
            value: true,
          },
          orderBy: { updatedAt: "asc" },
          take: MAX_RECHECKS_PER_TYPE,
        }),
      ]);

    const targets: RecheckTarget[] = [
      ...membershipPayments.flatMap((payment) =>
        payment.epsMerchantTxnId
          ? [
              {
                path: "/api/eps/membership/fail",
                merchantTransactionId: payment.epsMerchantTxnId,
                valueA: payment.membership.membershipId,
              },
            ]
          : [],
      ),
      ...orders.flatMap((order) =>
        order.epsMerchantTxnId
          ? [
              {
                path: "/api/eps/order/fail",
                merchantTransactionId: order.epsMerchantTxnId,
                valueA: order.id,
              },
            ]
          : [],
      ),
      ...consultations.flatMap((consultation) =>
        consultation.epsMerchantTxnId
          ? [
              {
                path: "/api/one-time-consultation/fail",
                merchantTransactionId: consultation.epsMerchantTxnId,
                valueA: consultation.bookingId,
              },
            ]
          : [],
      ),
      ...skinPurchaseSettings.flatMap((setting) => {
        const purchase = parsePendingSkinPurchase(setting.value);
        return purchase?.status === "PENDING" && purchase.merchantTransactionId
          ? [
              {
                path: "/api/skin-analysis/purchase/fail",
                merchantTransactionId: purchase.merchantTransactionId,
              },
            ]
          : [];
      }),
    ];

    let completed = 0;
    let inconclusive = 0;

    for (let index = 0; index < targets.length; index += RECHECK_CONCURRENCY) {
      const batch = targets.slice(index, index + RECHECK_CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (target) => {
          try {
            const response = await fetch(buildRecheckUrl(appBaseUrl, target), {
              cache: "no-store",
              redirect: "follow",
              signal: AbortSignal.timeout(30_000),
            });
            const remainedPending =
              response.url.includes("payment_pending") ||
              response.url.includes("purchase_pending");

            return response.ok && !remainedPending;
          } catch (error) {
            console.error(
              `Scheduled EPS re-check failed for ${target.merchantTransactionId}:`,
              error,
            );
            return false;
          }
        }),
      );

      completed += results.filter(Boolean).length;
      inconclusive += results.filter((result) => !result).length;
    }

    console.info(
      `EPS re-check completed for ${completed} attempts; ${inconclusive} remained inconclusive.`,
    );

    return Response.json({
      success: true,
      attemptsFound: targets.length,
      rechecksCompleted: completed,
      rechecksInconclusive: inconclusive,
      recordsDeleted: 0,
    });
  } catch (error) {
    console.error("Failed to run scheduled EPS re-checks:", error);
    return Response.json(
      { error: "Failed to run scheduled EPS re-checks." },
      { status: 500 },
    );
  }
}
