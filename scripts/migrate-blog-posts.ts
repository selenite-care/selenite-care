import { PrismaClient } from "@prisma/client";
import { getAllPosts } from "../lib/blog";

const prisma = new PrismaClient();

function getPostDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date();
  }

  return parsedDate;
}

async function main() {
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true, name: true },
  });

  if (!adminUser) {
    throw new Error("No ADMIN user found. Create an admin user before migrating blog posts.");
  }

  const posts = getAllPosts();
  let created = 0;
  let updated = 0;

  console.log(`Migrating ${posts.length} blog posts as ${adminUser.email ?? adminUser.name ?? adminUser.id}...`);

  for (const post of posts) {
    const postDate = getPostDate(post.date);
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
      select: { id: true },
    });

    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.image,
        category: post.category,
        tags: [],
        status: "PUBLISHED",
        authorId: adminUser.id,
        publishedAt: postDate,
        createdAt: postDate,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.image,
        category: post.category,
        status: "PUBLISHED",
        authorId: adminUser.id,
        publishedAt: postDate,
      },
    });

    if (existingPost) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`Blog migration complete. Created: ${created}, Updated: ${updated}.`);
}

main()
  .catch((error) => {
    console.error("Blog migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
