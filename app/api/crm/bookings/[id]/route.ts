import NextAuth from "next-auth";
import type { BookingStatus } from "@prisma/client";
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

const validStatuses = new Set<BookingStatus>([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]);

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json({ error: "Booking ID is required." }, { status: 400 });
  }

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
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
      doctor: {
        select: {
          id: true,
          name: true,
          designation: true,
          availability: true,
          bio: true,
          image: true,
        },
      },
      payment: true,
      surveyResponse: true,
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  return Response.json({ booking });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as PatchPayload;
  const status = typeof body.status === "string" ? body.status : "";

  if (!id) {
    return Response.json({ error: "Booking ID is required." }, { status: 400 });
  }

  if (!validStatuses.has(status as BookingStatus)) {
    return Response.json({ error: "Invalid booking status." }, { status: 400 });
  }

  const booking = await db.booking.update({
    where: { id },
    data: {
      status: status as BookingStatus,
    },
    select: {
      id: true,
      status: true,
    },
  });

  return Response.json({ booking });
}
