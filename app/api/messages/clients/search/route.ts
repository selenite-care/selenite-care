import NextAuth from "next-auth";
import { MembershipStatus } from "@prisma/client";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

const staffRoles = new Set(["ADMIN", "DOCTOR", "CRM"]);
const searchableMembershipStatuses: MembershipStatus[] = [
  MembershipStatus.ACTIVE,
  MembershipStatus.PENDING,
];

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!staffRoles.has(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return Response.json({ clients: [] });
  }

  try {
    const clients = await db.user.findMany({
      where: {
        role: "CLIENT",
        memberships: {
          some: {
            status: {
              in: searchableMembershipStatuses,
            },
          },
        },
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          {
            memberships: {
              some: {
                membershipId: {
                  contains: query,
                  mode: "insensitive",
                },
                status: {
                  in: searchableMembershipStatuses,
                },
              },
            },
          },
        ],
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        conversation: {
          select: {
            id: true,
          },
        },
        memberships: {
          where: {
            status: {
              in: searchableMembershipStatuses,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            membershipId: true,
            tier: true,
            status: true,
          },
        },
      },
    });

    return Response.json({
      clients: clients.map((client) => {
        const membership = client.memberships[0] ?? null;

        return {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          image: client.image,
          conversationId: client.conversation?.id ?? null,
          membershipId: membership?.membershipId ?? null,
          membershipTier: membership?.tier ?? null,
          membershipStatus: membership?.status ?? null,
        };
      }),
    });
  } catch (error) {
    console.error("Messages client search failed", error);
    return Response.json(
      { error: "Unable to search clients." },
      { status: 500 },
    );
  }
}
