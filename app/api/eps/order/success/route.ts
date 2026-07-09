import { NextResponse } from "next/server";
import { getEPSClient } from "@/lib/eps";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  createNotification,
  NOTIFICATION_TYPES,
} from "@/lib/notifications";

export const runtime = "nodejs";

function buildRedirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

function getMerchantTransactionId(request: Request) {
  const { searchParams } = new URL(request.url);

  return (
    searchParams.get("merchantTransactionId") ||
    searchParams.get("MerchantTransactionId") ||
    searchParams.get("merchant_transaction_id") ||
    ""
  ).trim();
}

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

function formatDeliveryArea(value: string) {
  switch (value) {
    case "INSIDE_DHAKA":
      return "Inside Dhaka";
    case "SUB_DHAKA":
      return "Sub Dhaka";
    case "OUTSIDE_DHAKA":
      return "Outside Dhaka";
    default:
      return value;
  }
}

function buildAdminEmailHtml(input: {
  orderId: string;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  deliveryArea: string;
  deliveryCharge: number;
  deliveryAddress: string | null;
  epsTransactionId: string;
  financialEntity: string;
  items: Array<{
    quantity: number;
    price: number;
    product: {
      name: string;
      type: string;
    };
  }>;
}) {
  const itemsHtml = input.items
    .map((item) => {
      const subtotal = item.price * item.quantity;

      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #EEE0D0;color:#2B2B2B;">${item.product.name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #EEE0D0;color:#6E6257;">${item.product.type}</td>
          <td style="padding:10px 0;border-bottom:1px solid #EEE0D0;color:#6E6257;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #EEE0D0;color:#6E6257;text-align:right;">${formatBdt(item.price)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #EEE0D0;color:#2B2B2B;text-align:right;">${formatBdt(subtotal)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#2B2B2B;line-height:1.6;background:#F8F5F0;padding:24px;">
      <div style="max-width:760px;margin:0 auto;background:#FFFFFF;border:1px solid #EADDCD;border-radius:16px;overflow:hidden;">
        <div style="background:#2B2B2B;padding:24px 28px;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#B87B68;">Selenite Care</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;color:#F8F5F0;">EPS Order Payment Confirmed</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin-top:0;">A product order payment has been confirmed through EPS.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:22px;">
            <tbody>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Order ID</td><td style="padding:10px;border-bottom:1px solid #EADDCD;"><strong>${input.orderId}</strong></td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Client</td><td style="padding:10px;border-bottom:1px solid #EADDCD;">${input.clientName} (${input.clientEmail})</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Total</td><td style="padding:10px;border-bottom:1px solid #EADDCD;"><strong>${formatBdt(input.totalAmount)}</strong></td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Delivery Area</td><td style="padding:10px;border-bottom:1px solid #EADDCD;">${formatDeliveryArea(input.deliveryArea)}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Delivery Charge</td><td style="padding:10px;border-bottom:1px solid #EADDCD;">${formatBdt(input.deliveryCharge)}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Delivery Address</td><td style="padding:10px;border-bottom:1px solid #EADDCD;">${input.deliveryAddress || "N/A"}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">EPS Transaction ID</td><td style="padding:10px;border-bottom:1px solid #EADDCD;">${input.epsTransactionId}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #EADDCD;">Financial Entity</td><td style="padding:10px;border-bottom:1px solid #EADDCD;">${input.financialEntity || "N/A"}</td></tr>
            </tbody>
          </table>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr>
                <th style="text-align:left;padding-bottom:8px;color:#884F38;">Product</th>
                <th style="text-align:left;padding-bottom:8px;color:#884F38;">Type</th>
                <th style="text-align:center;padding-bottom:8px;color:#884F38;">Qty</th>
                <th style="text-align:right;padding-bottom:8px;color:#884F38;">Unit</th>
                <th style="text-align:right;padding-bottom:8px;color:#884F38;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export async function GET(request: Request) {
  const merchantTransactionId = getMerchantTransactionId(request);

  if (!merchantTransactionId) {
    return buildRedirect(request, "/cart?error=payment_failed");
  }

  try {
    const verification = await getEPSClient().verifyPayment({
      merchantTransactionId,
    });

    if (verification.Status?.toLowerCase() !== "success") {
      return buildRedirect(request, "/cart?error=payment_failed");
    }

    const existingOrder = await db.order.findUnique({
      where: {
        epsMerchantTxnId: merchantTransactionId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    if (!existingOrder) {
      return buildRedirect(request, "/cart?error=payment_failed");
    }

    const order = await db.order.update({
      where: {
        id: existingOrder.id,
      },
      data: {
        status: "VERIFIED",
        epsTransactionId: verification.EpsTransactionId,
        epsPaymentMethod: verification.FinancialEntity,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const clientName = order.user.name || "Selenite Care Client";

    await Promise.allSettled([
      adminEmail
        ? sendEmail({
            to: adminEmail,
            subject: `EPS Order Payment Confirmed - ${order.id}`,
            html: buildAdminEmailHtml({
              orderId: order.id,
              clientName,
              clientEmail: order.user.email || "N/A",
              totalAmount: order.totalAmount,
              deliveryArea: order.deliveryArea,
              deliveryCharge: order.deliveryCharge,
              deliveryAddress: order.deliveryAddress,
              epsTransactionId: verification.EpsTransactionId,
              financialEntity: verification.FinancialEntity,
              items: order.items,
            }),
          })
        : Promise.resolve(),
      createNotification(
        order.userId,
        "Payment Confirmed",
        "Your order payment was successful. We will process your order shortly.",
        NOTIFICATION_TYPES.ORDER,
        `/dashboard/orders/${order.id}`,
      ),
    ]);

    return buildRedirect(
      request,
      `/orders/confirmation?orderId=${encodeURIComponent(order.id)}`,
    );
  } catch (error) {
    console.error("EPS order success handling failed:", error);

    return buildRedirect(request, "/cart?error=payment_failed");
  }
}
