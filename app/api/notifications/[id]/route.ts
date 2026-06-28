import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const notificationSelect = {
  id: true,
  title: true,
  message: true,
  type: true,
  isRead: true,
  link: true,
  createdAt: true,
} as const;

export async function PATCH(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json(
      { error: "Notification ID is required." },
      { status: 400 },
    );
  }

  const notification = await db.notification.updateMany({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      isRead: true,
    },
  });

  if (notification.count === 0) {
    return Response.json(
      { error: "Notification not found." },
      { status: 404 },
    );
  }

  const updatedNotification = await db.notification.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: notificationSelect,
  });

  return Response.json({
    notification: updatedNotification,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json(
      { error: "Notification ID is required." },
      { status: 400 },
    );
  }

  const result = await db.notification.deleteMany({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (result.count === 0) {
    return Response.json(
      { error: "Notification not found." },
      { status: 404 },
    );
  }

  return Response.json({
    success: true,
  });
}
