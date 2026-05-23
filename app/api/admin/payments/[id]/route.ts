import type { PaymentStatus } from "@prisma/client";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PatchPayload = {
  status?: unknown;
};

const validStatuses = new Set<PaymentStatus>([
  "UNPAID",
  "PAID",
  "REFUNDED",
]);

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as PatchPayload;
  const status = typeof body.status === "string" ? body.status : "";

  if (!id) {
    return Response.json({ error: "Payment ID is required." }, { status: 400 });
  }

  if (!validStatuses.has(status as PaymentStatus)) {
    return Response.json({ error: "Invalid payment status." }, { status: 400 });
  }

  const payment = await db.payment.update({
    where: { id },
    data: {
      status: status as PaymentStatus,
    },
  });

  return Response.json({ payment });
}
