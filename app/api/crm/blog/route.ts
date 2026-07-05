import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slugify";
import type { BlogPostStatus, Prisma } from "@prisma/client";

type BlogPostPayload = {
  title?: unknown;
  content?: unknown;
  excerpt?: unknown;
  coverImage?: unknown;
  category?: unknown;
  tags?: unknown;
};

const VALID_STATUSES = new Set<BlogPostStatus>([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

function canAccessCrmBlog(role: string | undefined) {
  return role === "CRM" || role === "ADMIN";
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canAccessCrmBlog(session.user.role)) {
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

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canAccessCrmBlog(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as BlogPostPayload;
  const title = normalizeOptionalString(body.title);
  const content = normalizeOptionalString(body.content);
  const excerpt = normalizeOptionalString(body.excerpt);
  const coverImage = normalizeOptionalString(body.coverImage);
  const category = normalizeOptionalString(body.category);
  const tags = normalizeTags(body.tags);

  if (!title || !content) {
    return Response.json(
      { error: "Title and content are required." },
      { status: 400 },
    );
  }

  const existingSlugs = await db.blogPost.findMany({
    select: {
      slug: true,
    },
  });
  const slug = generateUniqueSlug(
    title,
    existingSlugs.map((post) => post.slug),
  );

  const post = await db.blogPost.create({
    data: {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      coverImage: coverImage || null,
      category: category || null,
      tags,
      status: "DRAFT",
      authorId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
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
          image: true,
        },
      },
    },
  });

  return Response.json(
    {
      post: {
        ...post,
        author: {
          name: post.author.name,
          avatar: post.author.image,
        },
      },
    },
    { status: 201 },
  );
}
