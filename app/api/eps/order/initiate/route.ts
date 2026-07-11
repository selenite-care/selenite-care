import { auth } from "@/auth";
import {
  generateTransactionId,
  getEPSCallbackUrls,
  initializeEPSPayment,
} from "@/lib/eps";
import { db } from "@/lib/db";
import { PRODUCT_DISCOUNTS } from "@/lib/membershipDiscounts";

export const runtime = "nodejs";

type InitiateOrderPayload = {
  orderId?: unknown;
};

function normalizeCustomerPhone(phone: string | null) {
  const normalizedPhone = phone?.replace(/\D/g, "").slice(-11);
  return normalizedPhone || "01000000000";
}

function getDiscountTier(discountPercent: number) {
  if (discountPercent === PRODUCT_DISCOUNTS.PLATINUM) {
    return "PLATINUM";
  }

  if (discountPercent === PRODUCT_DISCOUNTS.CRYSTAL) {
    return "CRYSTAL";
  }

  return null;
}

function buildProductName(
  items: Array<{ product: { name: string } }>,
  discountPercent: number,
) {
  const firstItemName = items[0]?.product.name ?? "Selenite Care Order";
  const remainingCount = items.length - 1;
  const baseProductName =
    remainingCount > 0
      ? `${firstItemName} and ${remainingCount} more items`
      : firstItemName;
  const discountTier = getDiscountTier(discountPercent);

  return discountPercent > 0 && discountTier
    ? `${baseProductName} (includes ${discountPercent}% ${discountTier} membership discount)`
    : baseProductName;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let orderId = "";

  try {
    const body = (await request.json().catch(() => null)) as
      | InitiateOrderPayload
      | null;
    orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";

    if (!orderId) {
      return Response.json({ error: "orderId is required." }, { status: 400 });
    }

    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.items.length === 0) {
      return Response.json(
        { error: "Order has no items." },
        { status: 400 },
      );
    }

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

    const merchantTransactionId = generateTransactionId();

    const { successUrl, failUrl, cancelUrl } = getEPSCallbackUrls(
      "order",
      order.id,
    );

    const payment = await initializeEPSPayment({
      customerOrderId: order.id,
      merchantTransactionId,
      totalAmount: order.totalAmount,
      successUrl,
      failUrl,
      cancelUrl,
      customerName: user.name || "Selenite Care Client",
      customerEmail: user.email,
      customerPhone: normalizeCustomerPhone(user.phone),
      customerAddress: order.deliveryAddress || "Dhaka",
      productName: buildProductName(order.items, order.discountPercent),
      productList: order.items.map((item) => ({
        ProductName: item.product.name,
        NoOfItem: item.quantity.toString(),
        ProductPrice: item.price.toString(),
        ProductProfile: item.product.type,
        ProductCategory: item.product.type,
      })),
      valueA: order.id,
      valueB: session.user.id,
    });

    if (!payment.redirectUrl) {
      throw new Error("EPS did not return a payment redirect URL.");
    }

    await db.order.update({
      where: {
        id: order.id,
      },
      data: {
        epsMerchantTxnId: merchantTransactionId,
      },
    });

    return Response.json({
      redirectUrl: payment.redirectUrl,
    });
  } catch (error) {
    console.error("EPS order initiate failed:", error);

    if (orderId) {
      await db.order
        .updateMany({
          where: {
            id: orderId,
            userId: session.user.id,
            status: "PENDING",
            transactionRef: "EPS_PENDING",
          },
          data: {
            status: "CANCELLED",
          },
        })
        .catch((updateError) => {
          console.error("Failed to cancel EPS order after initiate error:", updateError);
        });
    }

    return Response.json(
      { error: "Unable to initiate EPS order payment." },
      { status: 500 },
    );
  }
}
