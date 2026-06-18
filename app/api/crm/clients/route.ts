import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const where: {
    role: "CLIENT";
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

  const clients = await db.user.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
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
  });

  return Response.json({ clients });
}
