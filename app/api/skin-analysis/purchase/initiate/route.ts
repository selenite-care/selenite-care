import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateTransactionId, initializeEPSPayment } from "@/lib/eps";
import { getSetting, updateSetting } from "@/lib/settings";

export const runtime = "nodejs";

type PurchaseInitiatePayload = {
  quantity?: unknown;
};

const DEFAULT_CREDIT_PRICE_BDT = 25;
const MAX_QUANTITY = 10;

function parseQuantity(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 1;

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(parsed)));
}

function parseCreditPrice(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_CREDIT_PRICE_BDT;
  }

  return parsed;
}

function normalizeCustomerPhone(phone: string | null) {
  const normalizedPhone = phone?.replace(/\D/g, "").slice(-11);
  return normalizedPhone || "01000000000";
}

function getAppBaseUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin
  );
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | PurchaseInitiatePayload
      | null;
    const quantity = parseQuantity(body?.quantity);
    const creditPrice = parseCreditPrice(
      await getSetting("skin_analysis_price_bdt"),
    );
    const amount = quantity * creditPrice;
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!user?.email) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const timestamp = Date.now();
    const merchantTransactionId = generateTransactionId();
    const appBaseUrl = getAppBaseUrl(request);
    const pendingKey = `skin_analysis_purchase_${merchantTransactionId}`;

    await updateSetting(
      pendingKey,
      JSON.stringify({
        merchantTransactionId,
        userId: user.id,
        quantity,
        amount,
        status: "PENDING",
        createdAt: new Date(timestamp).toISOString(),
      }),
      user.id,
    );

    const payment = await initializeEPSPayment({
      merchantTransactionId,
      customerOrderId: `ANALYSIS-${user.id}-${timestamp}`,
      totalAmount: amount,
      successUrl: `${appBaseUrl}/api/skin-analysis/purchase/success`,
      failUrl: `${appBaseUrl}/api/skin-analysis/purchase/fail`,
      cancelUrl: `${appBaseUrl}/api/skin-analysis/purchase/cancel`,
      customerName: user.name || "Selenite Care Client",
      customerEmail: user.email,
      customerPhone: normalizeCustomerPhone(user.phone),
      productName: `Skin Analysis Credit x${quantity}`,
      valueA: session.user.id,
      valueB: quantity.toString(),
    });

    if (!payment.redirectUrl) {
      throw new Error("EPS did not return a payment redirect URL.");
    }

    return Response.json({
      redirectUrl: payment.redirectUrl,
    });
  } catch (error) {
    console.error("EPS skin analysis purchase initiate failed:", error);

    return Response.json(
      { error: "Unable to initiate skin analysis credit payment." },
      { status: 500 },
    );
  }
}
