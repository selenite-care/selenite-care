import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type OrderPatchPayload = {
  status?: unknown;
};

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "VERIFIED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

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

  if (!ORDER_STATUSES.includes(rawStatus as OrderStatus)) {
    return Response.json({ error: "Invalid order status." }, { status: 400 });
  }

  const order = await db.order.update({
    where: { id },
    data: {
      status: rawStatus as OrderStatus,
    },
    select: {
      id: true,
      status: true,
    },
  });

  return Response.json({ order });
}
