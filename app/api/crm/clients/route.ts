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

  if (session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const membershipFilter =
    searchParams.get("membershipFilter")?.trim().toLowerCase() ?? "all";
  const search = searchParams.get("search")?.trim() || searchParams.get("q")?.trim() || "";
  const { page, limit, skip, take } = getPaginationParams(searchParams);

  const where: {
    role: "CLIENT";
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      email?: { contains: string; mode: "insensitive" };
      phone?: { contains: string; mode: "insensitive" };
    }>;
    memberships?:
      | { none: Record<string, never> }
      | {
          some: {
            status: (typeof MEMBERSHIP_STATUS_MAP)[keyof typeof MEMBERSHIP_STATUS_MAP];
          };
        };
  } = {
    role: "CLIENT",
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
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

  const [clients, totalCount] = await db.$transaction([
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
        createdAt: true,
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
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  return Response.json({
    clients,
    totalCount,
    pagination: getPaginationMeta({ page, limit, totalCount }),
  });
}
