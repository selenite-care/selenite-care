import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPaginationMeta, getPaginationParams } from "@/lib/apiPagination";
import type { BookingStatus, Prisma } from "@prisma/client";

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
  const bookingStatus: BookingStatus | undefined =
    statusFilter === "PENDING" ||
    statusFilter === "CONFIRMED" ||
    statusFilter === "COMPLETED" ||
    statusFilter === "CANCELLED"
      ? statusFilter
      : undefined;
  const where: Prisma.BookingWhereInput = {
    ...(search
      ? {
          OR: [
            { token: { contains: search, mode: "insensitive" as const } },
            { user: { is: { name: { contains: search, mode: "insensitive" as const } } } },
            { user: { is: { email: { contains: search, mode: "insensitive" as const } } } },
            { user: { is: { phone: { contains: search, mode: "insensitive" as const } } } },
            { service: { is: { name: { contains: search, mode: "insensitive" as const } } } },
            { doctor: { is: { name: { contains: search, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
    ...(bookingStatus ? { status: bookingStatus } : {}),
  };

  const [bookings, totalCount] = await Promise.all([
    db.booking.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        payment: {
          select: {
            id: true,
            stripePaymentId: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),
    db.booking.count({ where }),
  ]);

  return Response.json({
    bookings,
    totalCount,
    pagination: getPaginationMeta({ page, limit, totalCount }),
  });
}
