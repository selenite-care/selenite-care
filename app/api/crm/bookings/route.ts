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

  if (session.user.role !== "CRM") {
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
            { user: { is: { phone: { contains: search, mode: "insensitive" as const } } } },
            { service: { is: { name: { contains: search, mode: "insensitive" as const } } } },
            { doctor: { is: { name: { contains: search, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
    ...(bookingStatus ? { status: bookingStatus } : {}),
  };

  const [bookingRows, totalCount] = await db.$transaction([
    db.booking.findMany({
      where,
      orderBy: {
        appointmentTime: "desc",
      },
      skip,
      take,
      select: {
        id: true,
        token: true,
        appointmentTime: true,
        status: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            designation: true,
            availability: true,
          },
        },
        payment: {
          select: {
            status: true,
            amount: true,
          },
        },
        surveyResponse: {
          select: {
            id: true,
          },
        },
      },
    }),
    db.booking.count({ where }),
  ]);
  const bookings = bookingRows.map(({ surveyResponse, ...booking }) => ({
    ...booking,
    hasSurvey: Boolean(surveyResponse?.id),
  }));

  return Response.json({
    bookings,
    totalCount,
    pagination: getPaginationMeta({ page, limit, totalCount }),
  });
}
