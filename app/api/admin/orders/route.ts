import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPaginationParams } from "@/lib/apiPagination";
import type { OrderStatus, Prisma } from "@prisma/client";

const { auth } = NextAuth(authConfig);

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip, take } = getPaginationParams(searchParams);
  const search = searchParams.get("search")?.trim() || searchParams.get("q")?.trim() || "";
  const statusFilter = searchParams.get("statusFilter")?.trim().toUpperCase() ?? "ALL";
  const orderStatus: OrderStatus | undefined =
    statusFilter === "PENDING" ||
    statusFilter === "VERIFIED" ||
    statusFilter === "PROCESSING" ||
    statusFilter === "SHIPPED" ||
    statusFilter === "DELIVERED" ||
    statusFilter === "CANCELLED"
      ? statusFilter
      : undefined;

  const where: Prisma.OrderWhereInput = {
    ...(search
      ? {
          OR: [
            { id: { contains: search, mode: "insensitive" as const } },
            { transactionRef: { contains: search, mode: "insensitive" as const } },
            { user: { is: { name: { contains: search, mode: "insensitive" as const } } } },
            { user: { is: { email: { contains: search, mode: "insensitive" as const } } } },
            { user: { is: { phone: { contains: search, mode: "insensitive" as const } } } },
            { items: { some: { product: { is: { name: { contains: search, mode: "insensitive" as const } } } } } },
          ],
        }
      : {}),
    ...(orderStatus ? { status: orderStatus } : {}),
    ...(!orderStatus || orderStatus === "PENDING"
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
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        paymentMethod: true,
        status: true,
        deliveryArea: true,
        deliveryAddress: true,
        deliveryCharge: true,
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
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
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
    totalPages: Math.max(Math.ceil(totalCount / limit), 1),
  });
}
