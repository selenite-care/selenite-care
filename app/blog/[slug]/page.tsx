import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogShare from "@/components/blog/BlogShare";
import Avatar from "@/components/ui/Avatar";
import { db } from "@/lib/db";
import { formatDateOnly } from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: string | null;
  tags: string[];
  publishedAt: string | null;
  updatedAt: string;
  views: number;
  author: {
    name: string | null;
    avatar?: string | null;
  };
};

const canonicalBaseUrl = "https://selenitecare.com";
const publisherLogoUrl = `${canonicalBaseUrl}/logo-512x512.png`;

type BlogPostResponse = {
  post?: BlogPost;
  error?: string;
};

type BlogPostsResponse = {
  posts?: BlogPost[];
  error?: string;
};

function formatDate(date: string | null) {
  return formatDateOnly(date);
}

function formatViews(views: number) {
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(views >= 10_000_000 ? 0 : 1)}m`;
  }

  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(views >= 10_000 ? 0 : 1)}k`;
  }

  return String(views);
}

function getReadingTime(content: string) {
  const wordCount = content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / 200));
}

async function getBaseUrl() {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`;
}

async function fetchBlogPost(baseUrl: string, slug: string) {
  const response = await fetch(`${baseUrl}/api/blog/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  const data = (await response.json().catch(() => null)) as
    | BlogPostResponse
    | null;

  if (!response.ok || !data?.post) {
    throw new Error(data?.error ?? "Unable to load blog post.");
  }

  return data.post;
}

async function fetchSuggestedPosts(baseUrl: string, slug: string) {
  const response = await fetch(`${baseUrl}/api/blog`, {
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as
    | BlogPostsResponse
    | null;

  if (!response.ok) {
    return [];
  }

  return (data?.posts ?? []).filter((post) => post.slug !== slug).slice(0, 4);
}

async function fetchPostForMetadata(slug: string) {
  return db.blogPost.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      updatedAt: true,
      author: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostForMetadata(slug);

  if (!post) {
    return {
      title: "Blog | Selenite Care",
      description: "Skincare insights, wellness guidance, and expert perspectives.",
    };
  }

  const title = `${post.title} | Selenite Care`;
  const description =
    post.excerpt ?? "Skincare insights, wellness guidance, and expert perspectives.";
  const url = `${canonicalBaseUrl}/blog/${post.slug}`;
  const images = post.coverImage ? [post.coverImage] : undefined;
  const authorName = post.author.name ?? "Selenite Care";

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [authorName],
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const baseUrl = await getBaseUrl();
  const post = await fetchBlogPost(baseUrl, slug);

  if (!post) {
    notFound();
  }

  const suggestedPosts = await fetchSuggestedPosts(baseUrl, post.slug);
  const readingTime = getReadingTime(post.content);
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const canonicalPostUrl = `${canonicalBaseUrl}/blog/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description:
      post.excerpt ?? "Skincare insights, wellness guidance, and expert perspectives.",
    image: post.coverImage ? [post.coverImage] : undefined,
    author: {
      "@type": "Person",
      name: post.author.name ?? "Selenite Care",
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    publisher: {
      "@type": "Organization",
      name: "Selenite Care",
      logo: {
        "@type": "ImageObject",
        url: publisherLogoUrl,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalPostUrl,
    },
  };

  return (
    <main className="bg-page text-page min-h-screen px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <style>{`
        .blog-prose h1,
        .blog-prose h2,
        .blog-prose h3,
        .blog-prose h4 {
          color: var(--foreground);
          font-family: "Playfair Display", serif;
          font-weight: 700;
          line-height: 1.3;
          margin: 2rem 0 1rem;
        }

        .blog-prose h1 {
          font-size: 2.25rem;
        }

        .blog-prose h2 {
          font-size: 1.75rem;
        }

        .blog-prose h3 {
          font-size: 1.35rem;
        }

        .blog-prose h4 {
          font-size: 1.15rem;
        }

        .blog-prose p {
          color: var(--foreground);
          font-size: 1rem;
          line-height: 1.9;
          margin: 0 0 1rem;
        }

        .blog-prose ul,
        .blog-prose ol {
          margin: 1rem 0 1.5rem;
          padding-left: 1.5rem;
        }

        .blog-prose ul {
          list-style: disc;
        }

        .blog-prose ol {
          list-style: decimal;
        }

        .blog-prose li {
          color: var(--foreground);
          line-height: 1.8;
          margin-bottom: 0.6rem;
        }

        .blog-prose li::marker {
          color: #B87B68;
        }

        .blog-prose blockquote {
          margin: 1.5rem 0;
          border-left: 4px solid #B87B68;
          background: rgba(184, 123, 104, 0.08);
          padding: 1rem 1.25rem;
          color: #6E6257;
        }

        .blog-prose pre {
          margin: 1rem 0;
          overflow-x: auto;
          border-radius: 0.75rem;
          background: #2B2B2B;
          padding: 1rem;
          color: #F8F5F0;
        }

        .blog-prose code {
          border-radius: 0.35rem;
          background: rgba(43, 43, 43, 0.08);
          padding: 0.12rem 0.32rem;
          font-size: 0.9em;
        }

        .blog-prose pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }

        .blog-prose a {
          color: #B87B68;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .blog-prose img {
          margin: 1.25rem auto;
          max-width: 100%;
          border-radius: 0.75rem;
        }
      `}</style>

      <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)] lg:items-start">
        <article className="min-w-0">
          <Image
            src={post.coverImage ?? "/hero/blog1.png"}
            alt={post.title}
            width={1200}
            height={630}
            className="h-[260px] w-full rounded-[24px] object-cover sm:h-[360px] lg:h-[420px]"
            priority
          />

          <div className="mt-8">
            <span
              className="inline-flex rounded-full bg-[rgba(198,165,107,0.14)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#8A6A2F] dark:bg-amber-950/30 dark:text-amber-300"
            >
              {post.category ?? "Skin Care"}
            </span>

            <h1
              className="text-page mt-5 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {post.title}
            </h1>

            <div
              className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
              style={{ color: "#8C7967" }}
            >
              <span className="inline-flex items-center gap-2">
                <Avatar
                  imageUrl={post.author.avatar ?? null}
                  name={post.author.name ?? "Selenite Care"}
                  size="sm"
                />
                By{" "}
                <span className="font-semibold text-[var(--gold)]">
                  {post.author.name ?? "Selenite Care"}
                </span>
              </span>
              <span className="hidden sm:inline" style={{ color: "#B87B68" }}>
                •
              </span>
              <span>{formatDate(post.publishedAt)}</span>
              <span className="hidden sm:inline" style={{ color: "#B87B68" }}>
                &bull;
              </span>
              <span>{readingTime} min read</span>
              <span className="hidden sm:inline" style={{ color: "#B87B68" }}>
                &bull;
              </span>
              <span>👁 {formatViews(post.views)} views</span>
            </div>

            <div
              className="mt-6 h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, #B87B68 0%, rgba(198, 165, 107, 0.1) 100%)",
              }}
            />
          </div>

          <div
            className="blog-prose bg-card border-themed mt-8 rounded-[24px] border px-6 py-8 sm:px-8 sm:py-10"
            style={{ boxShadow: "0 18px 48px rgba(43, 43, 43, 0.05)" }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <BlogShare title={post.title} url={postUrl} />
        </article>

        <aside className="min-w-0 lg:sticky lg:top-8">
          <div className="bg-card border-themed rounded-[24px] border p-6" style={{ boxShadow: "0 18px 48px rgba(43, 43, 43, 0.05)" }}>
            <h2
              className="text-page text-2xl font-semibold"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Suggested Articles
            </h2>

            <div className="mt-6 space-y-4">
              {suggestedPosts.map((suggestedPost) => (
                <article
                  key={suggestedPost.slug}
                  className="bg-card border-themed rounded-[20px] border p-4 shadow-[0_0_0_rgba(198,165,107,0)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(198,165,107,0.18)] dark:bg-[#242220] dark:border-[#3D3530] dark:hover:shadow-[0_14px_30px_rgba(0,0,0,0.35)]"
                >
                  <Image
                    src={suggestedPost.coverImage ?? "/hero/blog1.png"}
                    alt={suggestedPost.title}
                    width={480}
                    height={240}
                    className="h-32 w-full rounded-[16px] object-cover"
                  />

                  <div className="mt-4">
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                      style={{
                        backgroundColor: "rgba(198, 165, 107, 0.14)",
                        color: "#8A6A2F",
                      }}
                    >
                      {suggestedPost.category ?? "Skin Care"}
                    </span>

                    <h3
                      className="mt-3 text-lg font-semibold leading-7 dark:text-[#F0EDE8]"
                      style={{
                        color: "#2B2B2B",
                        fontFamily: "Playfair Display, serif",
                      }}
                    >
                      {suggestedPost.title}
                    </h3>

                    <p className="mt-2 text-sm text-[#8C7967] dark:text-[#8A7D75]">
                      {formatDate(suggestedPost.publishedAt)}
                    </p>

                    <Link
                      href={`/blog/${suggestedPost.slug}`}
                      className="mt-4 inline-flex items-center text-sm font-semibold transition-colors hover:opacity-80 dark:text-[#F0EDE8]"
                      style={{ color: "#2B2B2B" }}
                    >
                      Continue Reading
                      <span className="ml-2" style={{ color: "#B87B68" }}>
                        →
                      </span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
