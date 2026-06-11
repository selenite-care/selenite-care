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
    <main
      className="min-h-screen px-6 py-12 sm:py-16"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <style>{`
        .blog-prose h2 {
          color: #2B2B2B;
          font-family: "Playfair Display", serif;
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 2rem 0 1rem;
        }

        .blog-prose p {
          color: #2B2B2B;
          font-size: 1rem;
          line-height: 1.9;
          margin: 0 0 1rem;
        }

        .blog-prose ul {
          margin: 1rem 0 1.5rem;
          padding-left: 1.5rem;
        }

        .blog-prose li {
          color: #2B2B2B;
          line-height: 1.8;
          margin-bottom: 0.6rem;
        }

        .blog-prose li::marker {
          color: #C6A56B;
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
              className="inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{
                backgroundColor: "rgba(198, 165, 107, 0.14)",
                color: "#8A6A2F",
              }}
            >
              {post.category}
            </span>

            <h1
              className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              {post.title}
            </h1>

            <div
              className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
              style={{ color: "#8C7967" }}
            >
              <span>By {post.author}</span>
              <span className="hidden sm:inline" style={{ color: "#C6A56B" }}>
                •
              </span>
              <span>{formatDate(post.date)}</span>
            </div>

            <div
              className="mt-6 h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, #C6A56B 0%, rgba(198, 165, 107, 0.1) 100%)",
              }}
            />
          </div>

          <div
            className="blog-prose mt-8 rounded-[24px] border bg-white px-6 py-8 sm:px-8 sm:py-10"
            style={{
              borderColor: "#D8C7B5",
              boxShadow: "0 18px 48px rgba(43, 43, 43, 0.05)",
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        <aside className="min-w-0 lg:sticky lg:top-8">
          <div
            className="rounded-[24px] border bg-white p-6"
            style={{
              borderColor: "#D8C7B5",
              boxShadow: "0 18px 48px rgba(43, 43, 43, 0.05)",
            }}
          >
            <h2
              className="text-2xl font-semibold"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Suggested Articles
            </h2>

            <div className="mt-6 space-y-4">
              {suggestedPosts.map((suggestedPost) => (
                <article
                  key={suggestedPost.slug}
                  className="rounded-[20px] border bg-white p-4 shadow-[0_0_0_rgba(198,165,107,0)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(198,165,107,0.18)]"
                  style={{
                    borderColor: "#D8C7B5",
                  }}
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
                      className="mt-3 text-lg font-semibold leading-7"
                      style={{
                        color: "#2B2B2B",
                        fontFamily: "Playfair Display, serif",
                      }}
                    >
                      {suggestedPost.title}
                    </h3>

                    <p
                      className="mt-2 text-sm"
                      style={{ color: "#8C7967" }}
                    >
                      {formatDate(suggestedPost.date)}
                    </p>

                    <Link
                      href={`/blog/${suggestedPost.slug}`}
                      className="mt-4 inline-flex items-center text-sm font-semibold transition-colors hover:opacity-80"
                      style={{ color: "#2B2B2B" }}
                    >
                      Continue Reading
                      <span className="ml-2" style={{ color: "#C6A56B" }}>
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
