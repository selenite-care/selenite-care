import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

const allowedRoles = new Set(["ADMIN", "DOCTOR", "CRM"]);

function getPreview(content: string | null | undefined) {
  if (!content) {
    return "";
  }

  return content.length > 60 ? `${content.slice(0, 60)}...` : content;
}

type CreateConversationPayload = {
  clientId?: unknown;
};

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!allowedRoles.has(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const [conversations, unreadCount] = await db.$transaction([
      db.conversation.findMany({
        orderBy: {
          lastMessage: "desc",
        },
        select: {
          id: true,
          clientId: true,
          lastMessage: true,
          createdAt: true,
          isRead: true,
          client: {
            select: {
              name: true,
              phone: true,
              image: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              content: true,
              createdAt: true,
            },
          },
        },
      }),
      db.conversation.count({
        where: {
          isRead: false,
        },
      }),
    ]);

    return Response.json({
      conversations: conversations
        .map((conversation) => {
        const lastMessageContent = conversation.messages[0]?.content ?? "";
        const latestMessageAt =
          conversation.messages[0]?.createdAt ??
          conversation.lastMessage ??
          conversation.createdAt;

        return {
          id: conversation.id,
          clientId: conversation.clientId,
          clientName: conversation.client.name,
          clientPhone: conversation.client.phone,
          clientImage: conversation.client.image,
          lastMessage: latestMessageAt,
          isRead: conversation.isRead,
          preview: getPreview(lastMessageContent),
        };
      })
        .sort(
          (a, b) =>
            new Date(b.lastMessage).getTime() -
            new Date(a.lastMessage).getTime(),
        ),
      unreadCount,
    });
  } catch (error) {
    console.error("Messages inbox GET failed", error);
    return Response.json(
      { error: "Unable to load message inbox." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!allowedRoles.has(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | CreateConversationPayload
    | null;
  const clientId =
    typeof body?.clientId === "string" ? body.clientId.trim() : "";

  if (!clientId) {
    return Response.json({ error: "clientId is required." }, { status: 400 });
  }

  try {
    const existingConversation = await db.conversation.findUnique({
      where: {
        clientId,
      },
      select: {
        id: true,
      },
    });

    if (existingConversation) {
      return Response.json({ conversationId: existingConversation.id });
    }

    const conversation = await db.conversation.create({
      data: {
        clientId,
        isRead: true,
      },
      select: {
        id: true,
      },
    });

    return Response.json({ conversationId: conversation.id });
  } catch (error) {
    console.error("Messages inbox POST failed", error);
    return Response.json(
      { error: "Unable to open conversation." },
      { status: 500 },
    );
  }
}
