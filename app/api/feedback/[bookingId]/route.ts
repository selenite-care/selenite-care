import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { sanitizeHtml } from "@/lib/sanitize";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

type PutPayload = {
  feedback?: unknown;
};

const privilegedRoles = new Set(["ADMIN", "DOCTOR", "CRM"]);

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
      token: true,
      doctor: {
        select: {
          userId: true,
        },
      },
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
    typeof body.feedback === "string" ? sanitizeHtml(body.feedback) || null : null;

  const customerFeedback = await db.customerFeedback.upsert({
    where: {
      bookingId,
    },
    update: {
      feedback,
      images: [],
    },
    create: {
      bookingId,
      feedback,
      images: [],
    },
  });

  try {
    const [admins, crms] = await Promise.all([
      db.user.findMany({
        where: {
          role: "ADMIN",
        },
        select: {
          id: true,
        },
      }),
      db.user.findMany({
        where: {
          role: "CRM",
        },
        select: {
          id: true,
        },
      }),
    ]);
    const notifications: Promise<unknown>[] = [];
    const title = "New Client Feedback";
    const message = `Client submitted feedback for booking #${booking.token}. Review it in the booking details.`;
    const notifiedUserIds = new Set<string>();

    function queueNotification(userId: string | null | undefined, link: string) {
      if (!userId || notifiedUserIds.has(userId)) {
        return;
      }

      notifiedUserIds.add(userId);
      notifications.push(
        createNotification(
          userId,
          title,
          message,
          NOTIFICATION_TYPES.FEEDBACK,
          link,
        ),
      );
    }

    for (const admin of admins) {
      queueNotification(admin.id, `/admin/bookings/${booking.id}`);
    }

    for (const crm of crms) {
      queueNotification(crm.id, `/crm/bookings/${booking.id}`);
    }

    queueNotification(booking.doctor?.userId, `/doctor/bookings/${booking.id}`);

    await Promise.all(notifications);
  } catch (notificationError) {
    console.error("Failed to create client feedback notifications", notificationError);
  }

  return Response.json({ customerFeedback });
}
