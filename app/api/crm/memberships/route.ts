import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPaginationMeta, getPaginationParams } from "@/lib/apiPagination";
import type { MembershipStatus, Prisma } from "@prisma/client";

const { auth } = NextAuth(authConfig);

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip, take } = getPaginationParams(searchParams);
  const search = searchParams.get("search")?.trim() || searchParams.get("q")?.trim() || "";
  const statusFilter = searchParams.get("statusFilter")?.trim().toUpperCase() ?? "ALL";
  const membershipStatus: MembershipStatus | undefined =
    statusFilter === "PENDING" ||
    statusFilter === "ACTIVE" ||
    statusFilter === "EXPIRED" ||
    statusFilter === "CANCELLED"
      ? statusFilter
      : undefined;
  const where: Prisma.MembershipWhereInput = {
    ...(search
      ? {
          OR: [
            { membershipId: { contains: search, mode: "insensitive" as const } },
            { user: { is: { name: { contains: search, mode: "insensitive" as const } } } },
            { user: { is: { email: { contains: search, mode: "insensitive" as const } } } },
            { user: { is: { phone: { contains: search, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
    ...(membershipStatus ? { status: membershipStatus } : {}),
  };

  const [memberships, totalCount] = await Promise.all([
    db.membership.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      select: {
        id: true,
        membershipId: true,
        tier: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    db.membership.count({ where }),
  ]);

  return Response.json({
    memberships,
    totalCount,
    pagination: getPaginationMeta({ page, limit, totalCount }),
  });
}
