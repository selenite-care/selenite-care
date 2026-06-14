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
  feedback?: unknown;
  images?: unknown;
};

const privilegedRoles = new Set(["ADMIN", "DOCTOR", "CRM"]);

function normalizeImages(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as string[];
  }

  return input
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);
}

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
      customerFeedback: true,
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  const canAccess =
    privilegedRoles.has(session.user.role) || session.user.id === booking.userId;

  if (!canAccess) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  return Response.json({ customerFeedback: booking.customerFeedback ?? null });
}

export async function PUT(request: Request, context: RouteContext) {
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
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  if (session.user.id !== booking.userId) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as PutPayload;
  const feedback =
    typeof body.feedback === "string" ? body.feedback.trim() || null : null;
  const images = normalizeImages(body.images);

  if (Array.isArray(body.images) && body.images.length > 2) {
    return Response.json(
      { error: "A maximum of 2 image URLs is allowed." },
      { status: 400 },
    );
  }

  const customerFeedback = await db.customerFeedback.upsert({
    where: {
      bookingId,
    },
    update: {
      feedback,
      images,
    },
    create: {
      bookingId,
      feedback,
      images,
    },
  });

  return Response.json({ customerFeedback });
}
