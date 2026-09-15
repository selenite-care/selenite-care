import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PaymentPayload = {
  amount?: unknown;
  method?: unknown;
  note?: unknown;
  paidAt?: unknown;
};

function parseAmount(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(amount) ? amount : null;
}

function formatBdt(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")} BDT`;
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as PaymentPayload | null;
  const amount = parseAmount(body?.amount);
  const method = typeof body?.method === "string" ? body.method : "";
  const normalizedMethod = method.trim().toUpperCase();
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const paidAtValue = typeof body?.paidAt === "string" ? body.paidAt : "";
  const paidAt = paidAtValue ? new Date(paidAtValue) : new Date();

  if (amount === null || amount <= 0) {
    return Response.json(
      { error: "Payment amount must be greater than 0." },
      { status: 400 },
    );
  }

  if (normalizedMethod !== "BKASH" && normalizedMethod !== "CASH") {
    return Response.json(
      { error: "Method must be bKash or Cash." },
      { status: 400 },
    );
  }

  if (Number.isNaN(paidAt.getTime())) {
    return Response.json({ error: "Invalid payment date." }, { status: 400 });
  }

  const influencer = await db.influencer.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!influencer) {
    return Response.json({ error: "Influencer not found." }, { status: 404 });
  }

  const payment = await db.$transaction(async (tx) => {
    const createdPayment = await tx.influencerPayment.create({
      data: {
        influencerId: influencer.id,
        amount,
        method: normalizedMethod,
        note: note || null,
        paidBy: session.user.email ?? session.user.name ?? "Admin",
        paidAt,
      },
    });

    await tx.influencer.update({
      where: {
        id: influencer.id,
      },
      data: {
        totalPaid: {
          increment: amount,
        },
      },
    });

    await tx.influencerReferral.updateMany({
      where: {
        influencerId: influencer.id,
        status: "PENDING",
      },
      data: {
        status: "PAID",
      },
    });

    return createdPayment;
  });

  await createNotification(
    influencer.userId,
    "Influencer payment processed",
    `Payment of ${formatBdt(amount)} has been processed to your account via ${
      normalizedMethod === "BKASH" ? "bKash" : "Cash"
    }.`,
    NOTIFICATION_TYPES.SUCCESS,
    "/influencer/earnings",
  );

  return Response.json({ payment });
}
