import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPaginationMeta, getPaginationParams } from "@/lib/apiPagination";

const { auth } = NextAuth(authConfig);

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip, take } = getPaginationParams(searchParams);
  const search = searchParams.get("search")?.trim() || searchParams.get("q")?.trim() || "";
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { interest: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [leads, totalCount] = await Promise.all([
    db.leadCapture.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        interest: true,
        createdAt: true,
      },
    }),
    db.leadCapture.count({ where }),
  ]);

  return Response.json({
    leads,
    totalCount,
    pagination: getPaginationMeta({ page, limit, totalCount }),
  });
}
