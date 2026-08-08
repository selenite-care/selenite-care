import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPaginationMeta, getPaginationParams } from "@/lib/apiPagination";

const { auth } = NextAuth(authConfig);

const MEMBERSHIP_STATUS_MAP = {
  pending: "PENDING",
  active: "ACTIVE",
  expired: "EXPIRED",
  cancelled: "CANCELLED",
} as const;

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const roleFilter = searchParams.get("roleFilter")?.trim().toUpperCase() ?? "ALL";
  const membershipFilter =
    searchParams.get("membershipFilter")?.trim().toLowerCase() ?? "all";
  const { page, limit, skip, take } = getPaginationParams(searchParams);

  const where: {
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      email?: { contains: string; mode: "insensitive" };
      phone?: { contains: string; mode: "insensitive" };
    }>;
    role?: "CLIENT" | "DOCTOR" | "CRM" | "ADMIN";
    memberships?:
      | { none: Record<string, never> }
      | {
          some: {
            status: (typeof MEMBERSHIP_STATUS_MAP)[keyof typeof MEMBERSHIP_STATUS_MAP];
          };
        };
  } = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (roleFilter === "CLIENT" || roleFilter === "DOCTOR" || roleFilter === "CRM" || roleFilter === "ADMIN") {
    where.role = roleFilter;
  }

  if (membershipFilter === "none") {
    where.memberships = { none: {} };
  } else if (membershipFilter in MEMBERSHIP_STATUS_MAP) {
    where.memberships = {
      some: {
        status:
          MEMBERSHIP_STATUS_MAP[
            membershipFilter as keyof typeof MEMBERSHIP_STATUS_MAP
          ],
      },
    };
  }

  const [users, totalCount] = await db.$transaction([
    db.user.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        accounts: {
          where: {
            provider: "google",
          },
          take: 1,
          select: {
            provider: true,
          },
        },
        memberships: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            tier: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            memberships: true,
            orders: true,
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  return Response.json({
    users,
    totalCount,
    pagination: getPaginationMeta({ page, limit, totalCount }),
  });
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { ids?: unknown }
    | null;
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      )
    : [];

  if (ids.length === 0) {
    return Response.json({ error: "No user IDs provided." }, { status: 400 });
  }

  const deletableUsers = await db.user.findMany({
    where: {
      id: { in: ids },
      role: "CLIENT",
      emailVerified: null,
      accounts: {
        none: {
          provider: "google",
        },
      },
      bookings: { none: {} },
      memberships: { none: {} },
      orders: { none: {} },
    },
    select: {
      id: true,
      conversation: {
        select: {
          id: true,
        },
      },
    },
  });
  const deletableIds = deletableUsers.map((user) => user.id);
  const conversationIds = deletableUsers
    .map((user) => user.conversation?.id)
    .filter((id): id is string => Boolean(id));

  if (deletableIds.length === 0) {
    return Response.json({ deletedCount: 0 });
  }

  await db.$transaction([
    db.message.deleteMany({
      where: {
        OR: [
          { senderId: { in: deletableIds } },
          { conversationId: { in: conversationIds } },
        ],
      },
    }),
    db.conversation.deleteMany({
      where: {
        id: { in: conversationIds },
      },
    }),
    db.notification.deleteMany({
      where: {
        userId: { in: deletableIds },
      },
    }),
    db.surveyProfile.deleteMany({
      where: {
        userId: { in: deletableIds },
      },
    }),
    db.account.deleteMany({
      where: {
        userId: { in: deletableIds },
      },
    }),
    db.user.deleteMany({
      where: {
        id: { in: deletableIds },
      },
    }),
  ]);

  return Response.json({ deletedCount: deletableIds.length });
}
