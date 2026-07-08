import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import type { OrderStatus } from "@prisma/client";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type OrderPatchPayload = {
  status?: unknown;
  estimatedDelivery?: unknown;
};

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "VERIFIED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const ORDER_NOTIFICATION_COPY: Partial<
  Record<OrderStatus, { title: string; message: string }>
> = {
  VERIFIED: {
    title: "Order Verified",
    message: "Your order has been verified and is being prepared.",
  },
  PROCESSING: {
    title: "Order Processing",
    message: "Your order is being processed.",
  },
  SHIPPED: {
    title: "Order Shipped",
    message: "Your order has been shipped! You will receive it soon.",
  },
  DELIVERED: {
    title: "Order Delivered",
    message: "Your order has been delivered. Thank you!",
  },
  CANCELLED: {
    title: "Order Cancelled",
    message: "Your order has been cancelled. Please contact us if you have questions.",
  },
};

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: Response.json({ error: "Unauthorized." }, { status: 401 }),
      session: null,
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      error: Response.json({ error: "Forbidden." }, { status: 403 }),
      session: null,
    };
  }

  return {
    error: null,
    session,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { error } = await requireAdmin();

  if (error) {
    return error;
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json({ error: "Order ID is required." }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      totalAmount: true,
      paymentMethod: true,
      status: true,
      deliveryArea: true,
      deliveryCharge: true,
      deliveryAddress: true,
      estimatedDelivery: true,
      transactionRef: true,
      proofImageUrl: true,
      note: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          product: {
            select: {
              id: true,
              name: true,
              type: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  return Response.json({ order });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireAdmin();

  if (error) {
    return error;
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json({ error: "Order ID is required." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as OrderPatchPayload;
  const rawStatus =
    typeof body.status === "string" ? body.status.trim().toUpperCase() : "";
  const hasStatusUpdate = typeof body.status === "string";
  const hasEstimatedDeliveryUpdate =
    typeof body.estimatedDelivery === "string";
  const estimatedDelivery = hasEstimatedDeliveryUpdate
    ? String(body.estimatedDelivery).trim()
    : undefined;

  if (
    hasStatusUpdate &&
    !ORDER_STATUSES.includes(rawStatus as OrderStatus)
  ) {
    return Response.json({ error: "Invalid order status." }, { status: 400 });
  }

  if (!hasStatusUpdate && !hasEstimatedDeliveryUpdate) {
    return Response.json(
      { error: "No valid order update was provided." },
      { status: 400 },
    );
  }

  const order = await db.order.update({
    where: { id },
    data: {
      ...(hasStatusUpdate ? { status: rawStatus as OrderStatus } : {}),
      ...(hasEstimatedDeliveryUpdate
        ? { estimatedDelivery: estimatedDelivery || null }
        : {}),
    },
    select: {
      id: true,
      status: true,
      estimatedDelivery: true,
      deliveryAddress: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (hasEstimatedDeliveryUpdate && estimatedDelivery) {
    try {
      await createNotification(
        order.user.id,
        "Delivery Update",
        `Your order will be delivered in ${estimatedDelivery}. Delivery address: ${
          order.deliveryAddress || "Not provided"
        }.`,
        NOTIFICATION_TYPES.ORDER,
        `/dashboard/orders/${order.id}`,
      );
    } catch (notificationError) {
      console.error("Failed to create delivery update notification", notificationError);
    }
  }

  const notificationCopy = hasStatusUpdate
    ? ORDER_NOTIFICATION_COPY[order.status]
    : undefined;

  if (notificationCopy) {
    try {
      await createNotification(
        order.user.id,
        notificationCopy.title,
        notificationCopy.message,
        NOTIFICATION_TYPES.ORDER,
        `/dashboard/orders/${order.id}`,
      );
    } catch (notificationError) {
      console.error("Failed to create order status notification", notificationError);
    }
  }

  if (
    hasStatusUpdate &&
    (order.status === "SHIPPED" || order.status === "DELIVERED")
  ) {
    try {
      const title =
        order.status === "SHIPPED" ? "Your Order Has Shipped" : "Your Order Was Delivered";
      const message =
        order.status === "SHIPPED"
          ? "Your Selenite Care order has been shipped and should reach you soon."
          : "Your Selenite Care order has been delivered. Thank you for shopping with us.";

      await sendEmail({
        to: order.user.email,
        subject:
          order.status === "SHIPPED"
            ? "Your Selenite Care Order Has Shipped"
            : "Your Selenite Care Order Has Been Delivered",
        html: `
          <div style="margin:0;padding:32px 16px;background-color:#F8F5F0;font-family:Arial,sans-serif;color:#2B2B2B;">
            <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #EADDCD;border-radius:18px;overflow:hidden;">
              <div style="padding:24px 28px;background:#2B2B2B;color:#F8F5F0;">
                <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#B87B68;">Selenite Care</div>
                <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-family:'Playfair Display',Georgia,serif;">${title}</h1>
              </div>
              <div style="padding:28px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hello ${order.user.name ?? "Valued Client"},</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4B4037;">${message}</p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
                  <tbody>
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;width:42%;">Order ID</td>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;font-weight:600;">${order.id}</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Status</td>
                      <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${order.status}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send order status email", emailError);
    }
  }

  return Response.json({ order });
}
