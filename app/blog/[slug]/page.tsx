import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

export const dynamic = "force-dynamic";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const suggestedPosts = getAllPosts().filter(
    (suggestedPost) => suggestedPost.slug !== post.slug,
  );

  return (
    <main className="bg-page text-page min-h-screen px-6 py-12 sm:py-16">
      <style>{`
        .blog-prose h2 {
          color: var(--foreground);
          font-family: "Playfair Display", serif;
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 2rem 0 1rem;
        }

        .blog-prose p {
          color: var(--foreground);
          font-size: 1rem;
          line-height: 1.9;
          margin: 0 0 1rem;
        }

        .blog-prose ul {
          margin: 1rem 0 1.5rem;
          padding-left: 1.5rem;
        }

        .blog-prose li {
          color: var(--foreground);
          line-height: 1.8;
          margin-bottom: 0.6rem;
        }

        .blog-prose li::marker {
          color: #B87B68;
        }
      `}</style>

      <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)] lg:items-start">
        <article className="min-w-0">
          <img
            src={post.image}
            alt={post.title}
            className="h-[260px] w-full rounded-[24px] object-cover sm:h-[360px] lg:h-[420px]"
          />

          <div className="mt-8">
            <span
              className="inline-flex rounded-full bg-[rgba(198,165,107,0.14)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#8A6A2F] dark:bg-amber-950/30 dark:text-amber-300"
            >
              {post.category}
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
              <span>By {post.author}</span>
              <span className="hidden sm:inline" style={{ color: "#B87B68" }}>
                •
              </span>
              <span>{formatDate(post.date)}</span>
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
                  <img
                    src={suggestedPost.image}
                    alt={suggestedPost.title}
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
                      {suggestedPost.category}
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
                      {formatDate(suggestedPost.date)}
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
