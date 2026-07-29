import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

const staffRoles = new Set(["ADMIN", "DOCTOR", "CRM"]);

type ConversationPayload = {
  clientId?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!staffRoles.has(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as
    | ConversationPayload
    | null;
  const clientId =
    typeof payload?.clientId === "string" ? payload.clientId.trim() : "";

  if (!clientId) {
    return Response.json({ error: "Client ID is required." }, { status: 400 });
  }

  try {
    const client = await db.user.findFirst({
      where: {
        id: clientId,
        role: "CLIENT",
        memberships: {
          some: {
            status: {
              in: ["ACTIVE", "PENDING"],
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        image: true,
      },
    });

    if (!client) {
      return Response.json(
        { error: "Eligible client not found." },
        { status: 404 },
      );
    }

    const conversation = await db.conversation.upsert({
      where: {
        clientId: client.id,
      },
      update: {},
      create: {
        clientId: client.id,
      },
      select: {
        id: true,
        clientId: true,
        lastMessage: true,
        isRead: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            content: true,
          },
        },
      },
    });

    const lastMessageContent = conversation.messages[0]?.content ?? "";

    return Response.json({
      conversation: {
        id: conversation.id,
        clientId: conversation.clientId,
        clientName: client.name,
        clientPhone: client.phone,
        clientImage: client.image,
        lastMessage: conversation.lastMessage,
        isRead: conversation.isRead,
        preview:
          lastMessageContent.length > 60
            ? `${lastMessageContent.slice(0, 60)}...`
            : lastMessageContent,
      },
    });
  } catch (error) {
    console.error("Messages conversation upsert failed", error);
    return Response.json(
      { error: "Unable to open conversation." },
      { status: 500 },
    );
  }
}
