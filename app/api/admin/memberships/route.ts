import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPaginationMeta, getPaginationParams } from "@/lib/apiPagination";
import type { MembershipStatus, MembershipTier, PaymentStatus, Prisma } from "@prisma/client";

const { auth } = NextAuth(authConfig);

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

export async function GET(request: Request) {
  const adminError = await requireAdmin();

  if (adminError) {
    return adminError;
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip, take } = getPaginationParams(searchParams);
  const search = searchParams.get("search")?.trim() || searchParams.get("q")?.trim() || "";
  const statusFilter = searchParams.get("statusFilter")?.trim().toUpperCase() ?? "ALL";
  const normalizedSearch = search.toUpperCase();
  const membershipTier: MembershipTier | undefined =
    normalizedSearch === "SIGNATURE" ||
    normalizedSearch === "CRYSTAL" ||
    normalizedSearch === "PLATINUM"
      ? normalizedSearch
      : undefined;
  const paymentStatus: PaymentStatus | undefined =
    normalizedSearch === "UNPAID" ||
    normalizedSearch === "PAID" ||
    normalizedSearch === "REFUNDED"
      ? normalizedSearch
      : undefined;
  const membershipStatus: MembershipStatus | undefined =
    statusFilter === "PENDING" ||
    statusFilter === "ACTIVE" ||
    statusFilter === "EXPIRED" ||
    statusFilter === "CANCELLED"
      ? statusFilter
      : undefined;
  const searchFilters: Prisma.MembershipWhereInput[] = search
    ? [
        { membershipId: { contains: search, mode: "insensitive" as const } },
        { user: { is: { name: { contains: search, mode: "insensitive" as const } } } },
        { user: { is: { email: { contains: search, mode: "insensitive" as const } } } },
        { user: { is: { phone: { contains: search, mode: "insensitive" as const } } } },
        ...(membershipTier ? [{ tier: { equals: membershipTier } }] : []),
        ...(paymentStatus ? [{ payment: { is: { status: { equals: paymentStatus } } } }] : []),
      ]
    : [];
  const where: Prisma.MembershipWhereInput = {
    ...(searchFilters.length > 0 ? { OR: searchFilters } : {}),
    ...(membershipStatus ? { status: membershipStatus } : {}),
  };

  const [memberships, totalCount] = await db.$transaction([
    db.membership.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            stripePaymentId: true,
            createdAt: true,
          },
        },
      },
    }),
    db.membership.count({ where }),
  ]);

  return Response.json({
    memberships,
    totalCount,
    page,
    totalPages: Math.max(Math.ceil(totalCount / limit), 1),
    pagination: getPaginationMeta({ page, limit, totalCount }),
  });
}
