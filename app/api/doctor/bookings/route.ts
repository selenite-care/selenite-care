import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPaginationMeta, getPaginationParams } from "@/lib/apiPagination";
import type { BookingStatus, Prisma } from "@prisma/client";

const { auth } = NextAuth(authConfig);

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "DOCTOR") {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip, take } = getPaginationParams(searchParams);
  const statusFilter = searchParams.get("statusFilter")?.trim().toUpperCase() ?? "ALL";
  const bookingStatus: BookingStatus | undefined =
    statusFilter === "PENDING" ||
    statusFilter === "CONFIRMED" ||
    statusFilter === "COMPLETED" ||
    statusFilter === "CANCELLED"
      ? statusFilter
      : undefined;

  const doctor = await db.doctor.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!doctor) {
    return new Response(
      JSON.stringify({
        bookings: [],
        totalCount: 0,
        pagination: getPaginationMeta({ page, limit, totalCount: 0 }),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const where: Prisma.BookingWhereInput = {
    doctorId: doctor.id,
    ...(bookingStatus ? { status: bookingStatus } : {}),
  };

  const [bookingRows, totalCount] = await db.$transaction([
    db.booking.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
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
        surveyResponse: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { appointmentTime: "desc" },
    }),
    db.booking.count({ where }),
  ]);
  const bookings = bookingRows.map(({ surveyResponse, ...booking }) => ({
    ...booking,
    hasSurvey: Boolean(surveyResponse?.id),
  }));

  return new Response(
    JSON.stringify({
      bookings,
      totalCount,
      pagination: getPaginationMeta({ page, limit, totalCount }),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
