import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import type { PaymentMethod, StockStatus } from "@prisma/client";

export const runtime = "nodejs";

type OrderItemPayload = {
  productId?: unknown;
  quantity?: unknown;
};

type CreateOrderPayload = {
  items?: unknown;
  paymentMethod?: unknown;
  transactionRef?: unknown;
  senderNumber?: unknown;
  proofImageUrl?: unknown;
  note?: unknown;
  deliveryAddress?: unknown;
};

function parsePaymentMethod(value: unknown): PaymentMethod | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (
    normalized === "BKASH" ||
    normalized === "BANK_TRANSFER" ||
    normalized === "CASH"
  ) {
    return normalized;
  }

  return null;
}

function normalizeItems(value: unknown): Array<{ productId: string; quantity: number }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const candidate = item as OrderItemPayload;
      const productId =
        typeof candidate.productId === "string" ? candidate.productId.trim() : "";
      const rawQuantity =
        typeof candidate.quantity === "number"
          ? candidate.quantity
          : typeof candidate.quantity === "string"
            ? Number(candidate.quantity)
            : Number.NaN;
      const quantity = Number.isFinite(rawQuantity)
        ? Math.max(1, Math.floor(rawQuantity))
        : Number.NaN;

      return { productId, quantity };
    })
    .filter((item) => item.productId && Number.isFinite(item.quantity));
}

function buildOrderNote({
  customNote,
  paymentMethod,
  senderNumber,
  deliveryAddress,
}: {
  customNote: string;
  paymentMethod: PaymentMethod;
  senderNumber: string;
  deliveryAddress: string;
}) {
  const parts: string[] = [];

  if (customNote) {
    parts.push(customNote);
  }

  if (paymentMethod === "BKASH" && senderNumber) {
    parts.push(`Sender: ${senderNumber}`);
  }

  if (paymentMethod === "CASH" && deliveryAddress) {
    parts.push(`Delivery Address: ${deliveryAddress}`);
  }

  return parts.length > 0 ? parts.join(" | ") : null;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateOrderPayload;
  const items = normalizeItems(body.items);
  const paymentMethod = parsePaymentMethod(body.paymentMethod);
  const transactionRef =
    typeof body.transactionRef === "string" ? body.transactionRef.trim() : "";
  const senderNumber =
    typeof body.senderNumber === "string" ? body.senderNumber.trim() : "";
  const proofImageUrl =
    typeof body.proofImageUrl === "string" ? body.proofImageUrl.trim() : "";
  const customNote = typeof body.note === "string" ? body.note.trim() : "";
  const deliveryAddress =
    typeof body.deliveryAddress === "string" ? body.deliveryAddress.trim() : "";

  if (items.length === 0) {
    return Response.json(
      { error: "Please add at least one product to your cart." },
      { status: 400 },
    );
  }

  if (!paymentMethod) {
    return Response.json(
      { error: "Please choose a payment method." },
      { status: 400 },
    );
  }

  if (paymentMethod === "BKASH") {
    if (!senderNumber) {
      return Response.json(
        { error: "Please enter the bKash number you paid from." },
        { status: 400 },
      );
    }

    if (!transactionRef && !proofImageUrl) {
      return Response.json(
        {
          error:
            "Please provide either a Transaction ID or a payment confirmation screenshot.",
        },
        { status: 400 },
      );
    }
  }

  if (paymentMethod === "BANK_TRANSFER" && !transactionRef && !proofImageUrl) {
    return Response.json(
      {
        error:
          "Please provide either a Transaction ID or a payment confirmation screenshot.",
      },
      { status: 400 },
    );
  }

  if (paymentMethod === "CASH" && !deliveryAddress) {
    return Response.json(
      { error: "Please enter your delivery address for cash on delivery." },
      { status: 400 },
    );
  }

  const productIds = items.map((item) => item.productId);
  const products = await db.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      isVisible: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      stockStatus: true,
    },
  });

  if (products.length !== productIds.length) {
    return Response.json(
      { error: "One or more cart items are no longer available." },
      { status: 400 },
    );
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const unavailableProduct = items.find((item) => {
    const product = productMap.get(item.productId);
    return !product || product.stockStatus === ("OUT_OF_STOCK" satisfies StockStatus);
  });

  if (unavailableProduct) {
    return Response.json(
      { error: "One or more products in your cart are out of stock." },
      { status: 400 },
    );
  }

  const totalAmount = items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  const note = buildOrderNote({
    customNote,
    paymentMethod,
    senderNumber,
    deliveryAddress,
  });

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

  if (!user) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  const createdOrder = await db.order.create({
    data: {
      userId: user.id,
      paymentMethod,
      totalAmount,
      transactionRef: transactionRef || null,
      proofImageUrl: proofImageUrl || null,
      note,
      items: {
        create: items.map((item) => {
          const product = productMap.get(item.productId)!;

          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          };
        }),
      },
    },
    select: {
      id: true,
      paymentMethod: true,
      status: true,
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL?.trim();

  if (!adminEmail) {
    console.error("ADMIN_EMAIL is not configured for product order notifications.");
  } else {
    const itemsHtml = items
      .map((item) => {
        const product = productMap.get(item.productId)!;
        const subtotal = product.price * item.quantity;

        return `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #2B2B2B;">${product.name}</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257; text-align: right;">${Math.round(product.price)} BDT</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #2B2B2B; text-align: right;">${Math.round(subtotal)} BDT</td>
          </tr>
        `;
      })
      .join("");

    const paymentMethodLabel =
      paymentMethod === "BKASH"
        ? "bKash"
        : paymentMethod === "BANK_TRANSFER"
          ? "Bank Transfer"
          : "Cash on Delivery";

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; color: #2B2B2B; line-height: 1.6; background: #F8F5F0; padding: 24px;">
        <div style="max-width: 760px; margin: 0 auto; background: #FFFFFF; border: 1px solid #D8C7B5; border-radius: 16px; overflow: hidden;">
          <div style="background: #2B2B2B; padding: 24px 28px;">
            <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #C6A56B;">Selenite Care</div>
            <h1 style="margin: 12px 0 0; font-size: 28px; line-height: 1.2; color: #F8F5F0;">New Product Order - Selenite Care</h1>
          </div>
          <div style="padding: 28px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tbody>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257; width: 42%;">Order ID</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; font-weight: 600;">${createdOrder.id}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Client Name</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${user.name ?? "-"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Client Email</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${user.email ?? "-"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Client Phone</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${user.phone ?? "-"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Payment Method</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${paymentMethodLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Transaction Reference</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${transactionRef || "Not provided"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Total Amount</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; font-weight: 600;">${Math.round(totalAmount)} BDT</td>
                </tr>
                ${
                  proofImageUrl
                    ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Proof Image</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;"><a href="${proofImageUrl}" style="color: #C6A56B;">View uploaded proof</a></td>
                </tr>`
                    : ""
                }
                ${
                  note
                    ? `
                <tr>
                  <td style="padding: 10px 0; color: #6E6257;">Note</td>
                  <td style="padding: 10px 0;">${note}</td>
                </tr>`
                    : ""
                }
              </tbody>
            </table>

            <div style="margin-top: 24px;">
              <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #8C7967;">Order Items</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr>
                    <th style="padding: 10px 0; border-bottom: 1px solid #D8C7B5; text-align: left; color: #2B2B2B;">Item</th>
                    <th style="padding: 10px 0; border-bottom: 1px solid #D8C7B5; text-align: center; color: #2B2B2B;">Qty</th>
                    <th style="padding: 10px 0; border-bottom: 1px solid #D8C7B5; text-align: right; color: #2B2B2B;">Price</th>
                    <th style="padding: 10px 0; border-bottom: 1px solid #D8C7B5; text-align: right; color: #2B2B2B;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: adminEmail,
        subject: "New Product Order - Selenite Care",
        html: adminHtml,
      });
    } catch (error) {
      console.error("Failed to send product order email", error);
    }
  }

  return Response.json(
    {
      orderId: createdOrder.id,
    },
    { status: 201 },
  );
}
