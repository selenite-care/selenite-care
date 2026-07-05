import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { BlogPostStatus, Prisma } from "@prisma/client";

const VALID_STATUSES = new Set<BlogPostStatus>([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

function canManageBlog(role: string | undefined) {
  return role === "ADMIN" || role === "CRM";
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canManageBlog(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const statusParam = searchParams.get("status")?.trim().toUpperCase();
  const status =
    statusParam && VALID_STATUSES.has(statusParam as BlogPostStatus)
      ? (statusParam as BlogPostStatus)
      : undefined;

  const where: Prisma.BlogPostWhereInput = {
    ...(query
      ? {
          title: {
            contains: query,
            mode: "insensitive",
          },
        }
      : {}),
    ...(status ? { status } : {}),
  };

  const posts = await db.blogPost.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      category: true,
      tags: true,
      status: true,
      publishedAt: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  return Response.json({ posts });
}
