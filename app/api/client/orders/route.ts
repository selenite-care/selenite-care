import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import type { OrderStatus, Prisma } from "@prisma/client";

const { auth } = NextAuth(authConfig);

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "VERIFIED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function getPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function parseStatus(value: string | null): OrderStatus | undefined {
  if (!value || value === "All") {
    return undefined;
  }

  const normalized = value.toUpperCase() as OrderStatus;
  return ORDER_STATUSES.includes(normalized) ? normalized : undefined;
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = getPositiveInteger(searchParams.get("page"), 1);
  const limit = Math.min(getPositiveInteger(searchParams.get("limit"), 20), 50);
  const status = parseStatus(searchParams.get("status"));
  const where: Prisma.OrderWhereInput = {
    userId: session.user.id,
    ...(status ? { status } : {}),
    ...(!status || status === "PENDING"
      ? {
          NOT: {
            status: "PENDING",
            transactionRef: "EPS_PENDING",
          },
        }
      : {}),
  };

  const [orders, totalCount] = await db.$transaction([
    db.order.findMany({
      where: {
        ...where,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        paymentMethod: true,
        status: true,
        deliveryArea: true,
        deliveryCharge: true,
        deliveryAddress: true,
        transactionRef: true,
        proofImageUrl: true,
        note: true,
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
                price: true,
                image: true,
              },
            },
          },
        },
      },
    }),
    db.order.count({ where }),
  ]);

  return Response.json({
    orders,
    totalCount,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
  });
}
