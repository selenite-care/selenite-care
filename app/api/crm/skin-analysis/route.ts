import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const { auth } = NextAuth(authConfig);

const PAGE_SIZE = 20;
const skinTypes = new Set(["Oily", "Dry", "Combination", "Normal", "Sensitive"]);

function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const requestedLimit =
    Number.parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10) ||
    PAGE_SIZE;
  const limit = Math.min(50, Math.max(1, requestedLimit));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

function buildWhere(searchParams: URLSearchParams): Prisma.SkinAnalysisWhereInput {
  const search = searchParams.get("search")?.trim() ?? "";
  const skinType = searchParams.get("skinType")?.trim() ?? "";

  return {
    ...(skinTypes.has(skinType) ? { skinType } : {}),
    ...(search
      ? {
          user: {
            is: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        }
      : {}),
  };
}

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
  const where = buildWhere(searchParams);

  const [analyses, totalCount] = await db.$transaction([
    db.skinAnalysis.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      select: {
        id: true,
        createdAt: true,
        skinType: true,
        concerns: true,
        pdfUrl: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    db.skinAnalysis.count({ where }),
  ]);

  return Response.json({
    analyses,
    totalCount,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
  });
}
