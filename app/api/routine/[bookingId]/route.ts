import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

type PutPayload = {
  content?: unknown;
};

const allowedRoles = new Set(["ADMIN", "DOCTOR", "CRM"]);

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { bookingId } = await context.params;

  if (!bookingId) {
    return Response.json({ error: "Booking ID is required." }, { status: 400 });
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      routineGuideline: true,
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  const canAccess =
    allowedRoles.has(session.user.role) || session.user.id === booking.userId;

  if (!canAccess) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  return Response.json({ routineGuideline: booking.routineGuideline ?? null });
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!allowedRoles.has(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { bookingId } = await context.params;

  if (!bookingId) {
    return Response.json({ error: "Booking ID is required." }, { status: 400 });
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { id: true },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as PutPayload;
  const content =
    typeof body.content === "string" ? body.content.trim() || null : null;

  const routineGuideline = await db.routineGuideline.upsert({
    where: {
      bookingId,
    },
    update: {
      content,
    },
    create: {
      bookingId,
      content,
    },
  });

  return Response.json({ routineGuideline });
}
