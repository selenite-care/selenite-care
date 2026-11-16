import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  getDeliveryAreaLabel,
  getDeliveryCharges,
  isCheckoutDeliveryArea,
  type CheckoutDeliveryArea,
} from "@/lib/deliveryCharges";
import {
  calculateOrderTotal,
  getProductDiscount,
} from "@/lib/membershipDiscounts";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import {
  COD_ENABLED,
  COD_INSIDE_DHAKA_ONLY,
  getSetting,
  getSettings,
  PRODUCT_DISCOUNT_ENABLED,
  PRODUCT_DISCOUNT_LABEL,
  PRODUCT_DISCOUNT_PERCENT,
} from "@/lib/settings";
import type { PaymentMethod } from "@prisma/client";

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
  deliveryArea?: unknown;
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

function parseDeliveryArea(value: unknown): CheckoutDeliveryArea | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return isCheckoutDeliveryArea(normalized) ? normalized : null;
}

function buildOrderNote({
  customNote,
  paymentMethod,
  senderNumber,
  deliveryArea,
  deliveryAddress,
  appliedDiscountNote,
}: {
  customNote: string;
  paymentMethod: PaymentMethod;
  senderNumber: string;
  deliveryArea: CheckoutDeliveryArea;
  deliveryAddress: string;
  appliedDiscountNote: string | null;
}) {
  const parts: string[] = [];

  if (customNote) {
    parts.push(customNote);
  }

  if (paymentMethod === "BKASH" && senderNumber) {
    parts.push(`Sender: ${senderNumber}`);
  }

  if (deliveryAddress) {
    parts.push(`Delivery Area: ${getDeliveryAreaLabel(deliveryArea)}`);
    parts.push(`Delivery Address: ${deliveryAddress}`);
  }

  if (appliedDiscountNote) {
    parts.push(appliedDiscountNote);
  }

  return parts.length > 0 ? parts.join(" | ") : null;
}

function parseBooleanSetting(value: string | null) {
  return ["true", "1", "yes", "on"].includes(value?.trim().toLowerCase() ?? "");
}

function parseDiscountPercent(value: string | null) {
  const percent = Number(value ?? 0);

  if (!Number.isFinite(percent)) {
    return 0;
  }

  return Math.min(100, Math.max(0, percent));
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
  const deliveryArea = parseDeliveryArea(body.deliveryArea);
  const deliveryAddress =
    typeof body.deliveryAddress === "string" ? body.deliveryAddress.trim() : "";
  const isCashOnDelivery = paymentMethod === "CASH";

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

  if (!deliveryArea) {
    return Response.json(
      {
        error:
          body.deliveryArea === "SUB_DHAKA"
            ? "Sub Dhaka is no longer a delivery option. Please choose Inside Dhaka or Outside Dhaka."
            : "Please choose a valid delivery area.",
      },
      { status: 400 },
    );
  }

  const deliveryCharges = await getDeliveryCharges();
  const deliveryCharge = deliveryCharges[deliveryArea];

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

  if (!deliveryAddress) {
    return Response.json(
      { error: "Please enter your delivery address." },
      { status: 400 },
    );
  }

  if (isCashOnDelivery) {
    const codSettings = await getSettings([
      COD_ENABLED,
      COD_INSIDE_DHAKA_ONLY,
    ]);
    const codEnabled = parseBooleanSetting(codSettings[COD_ENABLED] ?? null);
    const codInsideDhakaOnly = parseBooleanSetting(
      codSettings[COD_INSIDE_DHAKA_ONLY] ?? "false",
    );

    if (!codEnabled) {
      return Response.json(
        { error: "Cash on Delivery is currently unavailable." },
        { status: 403 },
      );
    }

    if (codInsideDhakaOnly && deliveryArea !== "INSIDE_DHAKA") {
      return Response.json(
        {
          error:
            "Cash on Delivery is currently restricted to Inside Dhaka by store settings.",
        },
        { status: 400 },
      );
    }
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
    },
  });

  if (products.length !== productIds.length) {
    return Response.json(
      { error: "One or more cart items are no longer available." },
      { status: 400 },
    );
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  const serverSubtotalAmount = items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  const activeMembership = await db.membership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      expiresAt: {
        gt: new Date(),
      },
      tier: {
        in: ["CRYSTAL", "PLATINUM"],
      },
    },
    select: {
      tier: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const [globalDiscountEnabledValue, globalDiscountPercentValue, globalDiscountLabel] =
    await Promise.all([
      getSetting(PRODUCT_DISCOUNT_ENABLED),
      getSetting(PRODUCT_DISCOUNT_PERCENT),
      getSetting(PRODUCT_DISCOUNT_LABEL),
    ]);
  const membershipDiscountPercent = getProductDiscount(activeMembership?.tier);
  const globalDiscountPercent = parseBooleanSetting(globalDiscountEnabledValue)
    ? parseDiscountPercent(globalDiscountPercentValue)
    : 0;
  const appliedDiscountPercent = Math.max(
    membershipDiscountPercent,
    globalDiscountPercent,
  );
  const appliedDiscountSource =
    appliedDiscountPercent > 0
      ? appliedDiscountPercent === membershipDiscountPercent &&
        membershipDiscountPercent >= globalDiscountPercent &&
        activeMembership
        ? `${activeMembership.tier} membership discount`
        : globalDiscountLabel?.trim() || "global product discount"
      : null;
  const orderBreakdown = calculateOrderTotal(
    serverSubtotalAmount,
    deliveryCharge,
    null,
  );
  orderBreakdown.discountPercent = appliedDiscountPercent;
  orderBreakdown.discountAmount = Math.round(
    (serverSubtotalAmount * appliedDiscountPercent) / 100,
  );
  orderBreakdown.total =
    serverSubtotalAmount - orderBreakdown.discountAmount + deliveryCharge;
  const totalAmount = orderBreakdown.total;
  const appliedDiscountNote =
    appliedDiscountSource && appliedDiscountPercent > 0
      ? `Applied Discount: ${appliedDiscountPercent}% (${appliedDiscountSource})`
      : null;

  const note = buildOrderNote({
    customNote,
    paymentMethod,
    senderNumber,
    deliveryArea,
    deliveryAddress,
    appliedDiscountNote,
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
      paymentStatus: "UNPAID",
      status: "PENDING",
      totalAmount,
      transactionRef: transactionRef || null,
      proofImageUrl: proofImageUrl || null,
      note,
      deliveryArea,
      deliveryCharge,
      deliveryAddress,
      discountPercent: orderBreakdown.discountPercent,
      discountAmount: orderBreakdown.discountAmount,
      subtotalAmount: orderBreakdown.subtotal,
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

  if (isCashOnDelivery && !adminEmail) {
    console.error("ADMIN_EMAIL is not configured for product order notifications.");
  } else if (isCashOnDelivery && adminEmail) {
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

    const paymentMethodLabel = "Cash on Delivery";

    const discountHtml =
      orderBreakdown.discountAmount > 0
        ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Discount (${appliedDiscountSource ?? "Applied"} - ${orderBreakdown.discountPercent}%)</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #15803D;">-${Math.round(orderBreakdown.discountAmount)} BDT</td>
                </tr>`
        : "";

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; color: #2B2B2B; line-height: 1.6; background: #F8F5F0; padding: 24px;">
        <div style="max-width: 760px; margin: 0 auto; background: #FFFFFF; border: 1px solid #EADDCD; border-radius: 16px; overflow: hidden;">
          <div style="background: #2B2B2B; padding: 24px 28px;">
            <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #B87B68;">Selenite Care</div>
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
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Delivery Area</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${getDeliveryAreaLabel(deliveryArea)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Delivery Address</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${deliveryAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Products Subtotal</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${Math.round(orderBreakdown.subtotal)} BDT</td>
                </tr>
                ${discountHtml}
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0; color: #6E6257;">Delivery Charge</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;">${Math.round(orderBreakdown.deliveryCharge)} BDT</td>
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
                  <td style="padding: 10px 0; border-bottom: 1px solid #EEE0D0;"><a href="${proofImageUrl}" style="color: #B87B68;">View uploaded proof</a></td>
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
                    <th style="padding: 10px 0; border-bottom: 1px solid #EADDCD; text-align: left; color: #2B2B2B;">Item</th>
                    <th style="padding: 10px 0; border-bottom: 1px solid #EADDCD; text-align: center; color: #2B2B2B;">Qty</th>
                    <th style="padding: 10px 0; border-bottom: 1px solid #EADDCD; text-align: right; color: #2B2B2B;">Price</th>
                    <th style="padding: 10px 0; border-bottom: 1px solid #EADDCD; text-align: right; color: #2B2B2B;">Subtotal</th>
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

  if (isCashOnDelivery) {
    try {
      const admins = await db.user.findMany({
        where: {
          role: "ADMIN",
          isActive: true,
        },
        select: {
          id: true,
        },
      });
      const clientName = user.name ?? user.email ?? "a client";

      await Promise.all(
        admins.map((admin) =>
          createNotification(
            admin.id,
            "New COD Order",
            `${clientName} placed a Cash on Delivery order for ${Math.round(totalAmount)} BDT.`,
            NOTIFICATION_TYPES.ORDER,
            "/admin/orders",
          ),
        ),
      );
    } catch (notificationError) {
      console.error("Failed to create admin order notification", notificationError);
    }
  }

  return Response.json(
    {
      orderId: createdOrder.id,
    },
    { status: 201 },
  );
}
