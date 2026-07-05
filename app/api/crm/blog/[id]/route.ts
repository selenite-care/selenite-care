import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateUniqueSlug, slugify } from "@/lib/slugify";
import type { BlogPostStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type BlogPostPatchPayload = {
  title?: unknown;
  content?: unknown;
  excerpt?: unknown;
  coverImage?: unknown;
  category?: unknown;
  tags?: unknown;
  status?: unknown;
  slug?: unknown;
};

const VALID_STATUSES = new Set<BlogPostStatus>([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

function canAccessCrmBlog(role: string | undefined) {
  return role === "CRM" || role === "ADMIN";
}

function canModifyPost({
  role,
  userId,
  authorId,
}: {
  role: string | undefined;
  userId: string | undefined;
  authorId: string;
}) {
  return role === "ADMIN" || (role === "CRM" && userId === authorId);
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function normalizeNullableString(value: string | undefined) {
  return value === undefined ? undefined : value || null;
}

function normalizeTags(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

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

  return undefined;
}

function normalizeStatus(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const status = value.trim().toUpperCase() as BlogPostStatus;
  return VALID_STATUSES.has(status) ? status : null;
}

function formatPostWithAvatar<
  T extends { author: { name: string | null; image: string | null } },
>(post: T) {
  return {
    ...post,
    author: {
      name: post.author.name,
      avatar: post.author.image,
    },
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canAccessCrmBlog(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const post = await db.blogPost.findUnique({
    where: {
      id,
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
      authorId: true,
      author: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!post) {
    return Response.json({ error: "Blog post not found." }, { status: 404 });
  }

  const canEdit = canModifyPost({
    role: session.user.role,
    userId: session.user.id,
    authorId: post.authorId,
  });

  return Response.json({ post: formatPostWithAvatar(post), canEdit });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canAccessCrmBlog(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const existingPost = await db.blogPost.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      authorId: true,
      publishedAt: true,
    },
  });

  if (!existingPost) {
    return Response.json({ error: "Blog post not found." }, { status: 404 });
  }

  if (
    !canModifyPost({
      role: session.user.role,
      userId: session.user.id,
      authorId: existingPost.authorId,
    })
  ) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as BlogPostPatchPayload;
  const title = normalizeOptionalString(body.title);
  const content = normalizeOptionalString(body.content);
  const excerpt = normalizeOptionalString(body.excerpt);
  const coverImage = normalizeOptionalString(body.coverImage);
  const category = normalizeOptionalString(body.category);
  const tags = normalizeTags(body.tags);
  const status = normalizeStatus(body.status);
  const requestedSlug = normalizeOptionalString(body.slug);

  if (title !== undefined && !title) {
    return Response.json({ error: "Title cannot be empty." }, { status: 400 });
  }

  if (content !== undefined && !content) {
    return Response.json({ error: "Content cannot be empty." }, { status: 400 });
  }

  if (status === null) {
    return Response.json({ error: "Invalid blog post status." }, { status: 400 });
  }

  let nextSlug: string | undefined;

  if (requestedSlug !== undefined) {
    const normalizedRequestedSlug = slugify(requestedSlug);

    if (!normalizedRequestedSlug) {
      return Response.json({ error: "Slug cannot be empty." }, { status: 400 });
    }

    const existingSlugs = await db.blogPost.findMany({
      where: {
        id: {
          not: existingPost.id,
        },
      },
      select: {
        slug: true,
      },
    });

    nextSlug = generateUniqueSlug(normalizedRequestedSlug, existingSlugs.map((post) => post.slug));
  } else if (title !== undefined && title !== existingPost.title) {
    const existingSlugs = await db.blogPost.findMany({
      where: {
        id: {
          not: existingPost.id,
        },
      },
      select: {
        slug: true,
      },
    });

    nextSlug = generateUniqueSlug(title, existingSlugs.map((post) => post.slug));
  }

  const post = await db.blogPost.update({
    where: {
      id: existingPost.id,
    },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(excerpt !== undefined ? { excerpt: normalizeNullableString(excerpt) } : {}),
      ...(coverImage !== undefined
        ? { coverImage: normalizeNullableString(coverImage) }
        : {}),
      ...(category !== undefined
        ? { category: normalizeNullableString(category) }
        : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(status !== undefined
        ? {
            status,
            ...(status === "PUBLISHED" && !existingPost.publishedAt
              ? { publishedAt: new Date() }
              : {}),
          }
        : {}),
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

  return Response.json({ post: formatPostWithAvatar(post) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canAccessCrmBlog(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const existingPost = await db.blogPost.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!existingPost) {
    return Response.json({ error: "Blog post not found." }, { status: 404 });
  }

  if (
    !canModifyPost({
      role: session.user.role,
      userId: session.user.id,
      authorId: existingPost.authorId,
    })
  ) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  await db.blogPost.delete({
    where: {
      id: existingPost.id,
    },
  });

  return Response.json({ success: true });
}
