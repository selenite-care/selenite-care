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

type MessagePostPayload = {
  content?: unknown;
  messageType?: unknown;
  conversationId?: unknown;
};

function serializeMessage(message: {
  id: string;
  conversationId: string;
  content: string;
  messageType: string;
  isReadByClient: boolean;
  createdAt: Date;
  sender: {
    role: string;
  };
}) {
  const isClientSender = message.sender.role === "CLIENT";

  return {
    id: message.id,
    conversationId: message.conversationId,
    content: message.content,
    messageType: message.messageType,
    isReadByClient: message.isReadByClient,
    createdAt: message.createdAt,
    senderRole: message.sender.role,
    senderLabel: isClientSender ? "You" : "Selenite Care",
  };
}

function normalizeMessageType(input: unknown) {
  if (typeof input !== "string" || !input.trim()) {
    return MessageType.TEXT;
  }

  const normalized = input.trim().toUpperCase();
  return allowedMessageTypes[normalized] ?? null;
}

async function findOrCreateClientConversation(clientId: string) {
  return db.conversation.upsert({
    where: {
      clientId,
    },
    update: {},
    create: {
      clientId,
    },
    select: {
      id: true,
      clientId: true,
    },
  });
}

async function findMessageForResponse(messageId: string) {
  return db.message.findUnique({
    where: {
      id: messageId,
    },
    include: {
      sender: {
        select: {
          role: true,
        },
      },
    },
  });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "CLIENT") {
    return Response.json({ messages: [] });
  }

  try {
    const conversation = await findOrCreateClientConversation(session.user.id);

    await db.message.updateMany({
      where: {
        conversationId: conversation.id,
      },
      data: {
        isReadByClient: true,
      },
    });

    const messages = await db.message.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        sender: {
          select: {
            role: true,
          },
        },
      },
    });

    return Response.json({
      conversationId: conversation.id,
      messages: messages.map(serializeMessage),
    });
  } catch (error) {
    console.error("Messages GET failed", error);
    return Response.json(
      { error: "Unable to load messages." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | MessagePostPayload
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
    const now = new Date();

    if (session.user.role === "CLIENT") {
      const conversation = await findOrCreateClientConversation(session.user.id);
      const message = await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: session.user.id,
          content,
          messageType,
          isReadByClient: true,
        },
      });

      await db.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          lastMessage: now,
          isRead: false,
        },
      });

      const messageForResponse = await findMessageForResponse(message.id);

      if (!messageForResponse) {
        throw new Error("Message was created but could not be loaded.");
      }

      return Response.json(
        { message: serializeMessage(messageForResponse) },
        { status: 201 },
      );
    }

    if (!staffRoles.has(session.user.role)) {
      return Response.json({ error: "Forbidden." }, { status: 403 });
    }

    const conversationId =
      typeof payload?.conversationId === "string"
        ? payload.conversationId.trim()
        : "";

    if (!conversationId) {
      return Response.json(
        { error: "Conversation ID is required." },
        { status: 400 },
      );
    }

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
    });

    await db.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        lastMessage: now,
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

    const messageForResponse = await findMessageForResponse(message.id);

    if (!messageForResponse) {
      throw new Error("Message was created but could not be loaded.");
    }

    return Response.json(
      { message: serializeMessage(messageForResponse) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Messages POST failed", error);
    return Response.json(
      { error: "Unable to send message." },
      { status: 500 },
    );
  }
}
