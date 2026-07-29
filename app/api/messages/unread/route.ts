import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

const staffRoles = new Set(["ADMIN", "DOCTOR", "CRM"]);

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    if (session.user.role === "CLIENT") {
      const conversation = await db.conversation.findUnique({
        where: {
          clientId: session.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!conversation) {
        return Response.json({ count: 0 });
      }

      const count = await db.message.count({
        where: {
          conversationId: conversation.id,
          isReadByClient: false,
        },
      });

      return Response.json({ count });
    }

    if (staffRoles.has(session.user.role)) {
      const count = await db.conversation.count({
        where: {
          isRead: false,
        },
      });

      return Response.json({ count });
    }

    return Response.json({ error: "Forbidden." }, { status: 403 });
  } catch (error) {
    console.error("Messages unread GET failed", error);
    return Response.json(
      { error: "Unable to load unread message count." },
      { status: 500 },
    );
  }
}
