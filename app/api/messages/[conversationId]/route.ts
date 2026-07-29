import NextAuth from "next-auth";
import { MessageType } from "@prisma/client";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { sanitizeText } from "@/lib/sanitize";

const { auth } = NextAuth(authConfig);

const staffRoles = new Set(["ADMIN", "DOCTOR", "CRM"]);
const allowedMessageTypes: Record<string, MessageType> = {
  TEXT: MessageType.TEXT,
  LINK: MessageType.LINK,
  IMAGE: MessageType.IMAGE,
};

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

type MessagePayload = {
  content?: unknown;
  messageType?: unknown;
};

function normalizeMessageType(input: unknown) {
  if (typeof input !== "string" || !input.trim()) {
    return MessageType.TEXT;
  }

  const normalized = input.trim().toUpperCase();
  return allowedMessageTypes[normalized] ?? null;
}

function serializeStaffMessage(message: {
  id: string;
  content: string;
  messageType: string;
  createdAt: Date;
  sender: {
    name: string | null;
    role: string;
  };
}) {
  return {
    id: message.id,
    content: message.content,
    messageType: message.messageType,
    createdAt: message.createdAt,
    senderRole: message.sender.role,
    senderName:
      message.sender.role === "CLIENT"
        ? "Client"
        : message.sender.name || message.sender.role,
  };
}

async function getStaffSession() {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      response: Response.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!staffRoles.has(session.user.role)) {
    return {
      session: null,
      response: Response.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return {
    session,
    response: null,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { session, response } = await getStaffSession();

  if (!session) {
    return response;
  }

  const { conversationId } = await context.params;

  if (!conversationId) {
    return Response.json(
      { error: "Conversation ID is required." },
      { status: 400 },
    );
  }

  try {
    const conversation = await db.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      return Response.json({ error: "Conversation not found." }, { status: 404 });
    }

    const [messages] = await db.$transaction([
      db.message.findMany({
        where: {
          conversationId,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          sender: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      }),
      db.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          isRead: true,
        },
      }),
    ]);

    return Response.json({
      conversationId,
      messages: messages.map(serializeStaffMessage),
    });
  } catch (error) {
    console.error("Messages conversation GET failed", error);
    return Response.json(
      { error: "Unable to load conversation messages." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { session, response } = await getStaffSession();

  if (!session) {
    return response;
  }

  const { conversationId } = await context.params;

  if (!conversationId) {
    return Response.json(
      { error: "Conversation ID is required." },
      { status: 400 },
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | MessagePayload
    | null;
  const content = sanitizeText(
    typeof payload?.content === "string" ? payload.content : "",
  );
  const messageType = normalizeMessageType(payload?.messageType);

  if (!content) {
    return Response.json({ error: "Message content is required." }, { status: 400 });
  }

  if (!messageType) {
    return Response.json({ error: "Invalid message type." }, { status: 400 });
  }

  try {
    const conversation = await db.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
        clientId: true,
      },
    });

    if (!conversation) {
      return Response.json({ error: "Conversation not found." }, { status: 404 });
    }

    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        content,
        messageType,
        isReadByClient: false,
      },
      include: {
        sender: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    await db.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        lastMessage: new Date(),
        isRead: true,
      },
    });

    try {
      const preview = content.length > 50 ? `${content.slice(0, 50)}...` : content;
      await createNotification(
        conversation.clientId,
        "New Message from Selenite Care",
        preview,
        NOTIFICATION_TYPES.INFO,
        "/dashboard/messages",
      );
    } catch (notificationError) {
      console.error("Failed to create message notification", notificationError);
    }

    return Response.json(
      { message: serializeStaffMessage(message) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Messages conversation POST failed", error);
    return Response.json(
      { error: "Unable to send message." },
      { status: 500 },
    );
  }
}
