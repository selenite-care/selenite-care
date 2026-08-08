import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  try {
    const users = await db.user.findMany({
      where: {
        role: "CLIENT",
        emailVerified: null,
        createdAt: {
          lt: cutoff,
        },
        bookings: {
          none: {},
        },
        memberships: {
          none: {},
        },
        orders: {
          none: {},
        },
        accounts: {
          none: {
            provider: "google",
          },
        },
        surveyProfile: {
          is: null,
        },
      },
      select: {
        id: true,
      },
    });
    const userIds = users.map((user) => user.id);

    if (userIds.length === 0) {
      return Response.json({
        success: true,
        deletedCount: 0,
      });
    }

    const [, , deletedUsers] = await db.$transaction([
      db.account.deleteMany({
        where: {
          userId: {
            in: userIds,
          },
        },
      }),
      db.notification.deleteMany({
        where: {
          userId: {
            in: userIds,
          },
        },
      }),
      db.user.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      }),
    ]);

    return Response.json({
      success: true,
      deletedCount: deletedUsers.count,
    });
  } catch (error) {
    console.error("Failed to cleanup unverified users:", error);
    return Response.json(
      { error: "Failed to cleanup unverified users." },
      { status: 500 },
    );
  }
}
