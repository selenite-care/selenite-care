import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

const notificationSelect = {
  id: true,
  title: true,
  message: true,
  type: true,
  isRead: true,
  link: true,
  createdAt: true,
} as const;

const NOTIFICATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        {
          isRead: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 20,
      select: notificationSelect,
    }),
    db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    }),
  ]);

  if (Math.random() < 0.1) {
    void db.notification
      .deleteMany({
        where: {
          userId: session.user.id,
          createdAt: {
            lt: new Date(Date.now() - NOTIFICATION_RETENTION_MS),
          },
        },
      })
      .catch((error) => {
        console.error("Notification cleanup failed:", error);
      });
  }

  return Response.json({
    notifications,
    unreadCount,
  });
}

export async function PATCH() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await db.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return Response.json({
    success: true,
    updatedCount: result.count,
  });
}
