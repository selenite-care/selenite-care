import { auth } from "@/auth";
import {
  generateTransactionId,
  getEPSCallbackUrls,
  initializeEPSPayment,
} from "@/lib/eps";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type InitiateOrderPayload = {
  orderId?: unknown;
};

function normalizeCustomerPhone(phone: string | null) {
  const normalizedPhone = phone?.replace(/\D/g, "").slice(-11);
  return normalizedPhone || "01000000000";
}

function buildProductName(items: Array<{ product: { name: string } }>) {
  const firstItemName = items[0]?.product.name ?? "Selenite Care Order";
  const remainingCount = items.length - 1;

  return remainingCount > 0
    ? `${firstItemName} and ${remainingCount} more items`
    : firstItemName;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | InitiateOrderPayload
      | null;
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";

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

    await db.order.update({
      where: {
        id: order.id,
      },
      data: {
        epsMerchantTxnId: merchantTransactionId,
      },
    });

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
      productName: buildProductName(order.items),
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

    return Response.json({
      redirectUrl: payment.redirectUrl,
    });
  } catch (error) {
    console.error("EPS order initiate failed:", error);

    return Response.json(
      { error: "Unable to initiate EPS order payment." },
      { status: 500 },
    );
  }
}
