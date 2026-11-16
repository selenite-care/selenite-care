import { auth } from "@/auth";
import { db } from "@/lib/db";
import { applyEPSPaymentSuccess } from "@/lib/epsRecheck";

export const runtime = "nodejs";

type RecheckPayload = {
  type?: unknown;
  id?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as RecheckPayload;
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const id = typeof body.id === "string" ? body.id.trim() : "";

  if (!id || (type !== "order" && type !== "consultation")) {
    return Response.json(
      { error: "A valid EPS record type and ID are required." },
      { status: 400 },
    );
  }

  if (type === "order") {
    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        epsMerchantTxnId: true,
      },
    });

    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return Response.json({ verified: true, order });
    }

    if (!order.epsMerchantTxnId) {
      return Response.json(
        { error: "This order does not have an EPS transaction to re-check." },
        { status: 400 },
      );
    }

    await applyEPSPaymentSuccess(
      "order",
      order.epsMerchantTxnId,
      new URL(request.url).origin,
    );

    const updatedOrder = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        epsMerchantTxnId: true,
      },
    });

    if (updatedOrder?.paymentStatus !== "PAID") {
      return Response.json(
        {
          verified: false,
          error: "EPS has not confirmed a successful payment for this order.",
        },
        { status: 409 },
      );
    }

    return Response.json({ verified: true, order: updatedOrder });
  }

  const consultation = await db.oneTimeConsultation.findUnique({
    where: { id },
    select: {
      id: true,
      paymentStatus: true,
      paymentConflict: true,
      paymentConflictNote: true,
      epsMerchantTxnId: true,
      booking: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!consultation) {
    return Response.json(
      { error: "Consultation payment record not found." },
      { status: 404 },
    );
  }

  if (consultation.paymentStatus === "PAID") {
    return Response.json({ verified: true, consultation });
  }

  if (!consultation.epsMerchantTxnId) {
    return Response.json(
      {
        error: "This consultation does not have an EPS transaction to re-check.",
      },
      { status: 400 },
    );
  }

  await applyEPSPaymentSuccess(
    "consultation",
    consultation.epsMerchantTxnId,
    new URL(request.url).origin,
  );

  const updatedConsultation = await db.oneTimeConsultation.findUnique({
    where: { id },
    select: {
      id: true,
      paymentStatus: true,
      paymentConflict: true,
      paymentConflictNote: true,
      epsMerchantTxnId: true,
      booking: {
        select: {
          status: true,
        },
      },
    },
  });

  if (updatedConsultation?.paymentStatus !== "PAID") {
    return Response.json(
      {
        verified: false,
        error:
          "EPS has not confirmed a successful payment for this consultation.",
      },
      { status: 409 },
    );
  }

  return Response.json({
    verified: true,
    consultation: updatedConsultation,
  });
}
