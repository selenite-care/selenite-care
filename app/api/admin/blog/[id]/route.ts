import { auth } from "@/auth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
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

  return Response.json({
    post: {
      ...post,
      author: {
        name: post.author.name,
        avatar: post.author.image,
      },
    },
  });
}
