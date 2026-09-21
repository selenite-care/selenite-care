import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      followUpUsed?: unknown;
    } | null;

    if (body?.followUpUsed !== true) {
      return Response.json(
        { error: "followUpUsed must be true." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const existing = await db.oneTimeConsultation.findUnique({
      where: { id },
      select: {
        id: true,
        paymentStatus: true,
        followUpUsed: true,
        booking: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!existing) {
      return Response.json(
        { error: "One-time consultation not found." },
        { status: 404 },
      );
    }

    if (existing.paymentStatus !== "PAID") {
      return Response.json(
        { error: "Only paid consultations can use a follow-up session." },
        { status: 400 },
      );
    }

    if (existing.followUpUsed) {
      return Response.json({ success: true, followUpUsed: true });
    }

    await db.$transaction(async (transaction) => {
      await transaction.oneTimeConsultation.update({
        where: { id },
        data: {
          followUpUsed: true,
        },
      });

      await transaction.notification.create({
        data: {
          userId: existing.booking.userId,
          type: "INFO",
          title: "Follow-up Session Used",
          message:
            "Your complimentary follow-up session has been marked as used. Thank you for choosing Selenite Care!",
          link: `/dashboard/bookings/${existing.booking.id}`,
        },
      });
    });

    return Response.json({ success: true, followUpUsed: true });
  } catch (error) {
    console.error("Failed to mark follow-up session as used:", error);
    return Response.json(
      { error: "Unable to update the follow-up session." },
      { status: 500 },
    );
  }
}
