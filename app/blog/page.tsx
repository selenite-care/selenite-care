import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

function formatDateParts(iso: string) {
  const date = new Date(iso);

  return {
    day: date.toLocaleDateString("en-US", { day: "2-digit" }),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main
      className="min-h-screen px-6 py-12 sm:py-16"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <div className="mx-auto w-full max-w-7xl">
        <section className="max-w-3xl">
          <h1
            className="text-4xl font-bold tracking-tight sm:text-5xl"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Our Blog
          </h1>
          <p
            className="mt-4 text-base leading-8 sm:text-lg"
            style={{ color: "#B8A89A" }}
          >
            Skincare insights, wellness guidance, and expert perspectives.
          </p>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => {
            const { day, month } = formatDateParts(post.date);

            return (
              <article
                key={post.slug}
                className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(198,165,107,0.18)]"
                style={{
                  borderColor: "#E8DDD5",
                }}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="block h-[220px] w-full object-cover"
                  />

                  <div
                    className="absolute left-4 top-4 min-w-[46px] rounded-md bg-white px-[10px] py-[6px] text-center shadow-[0_2px_10px_rgba(0,0,0,0.12)]"
                  >
                    <p
                      className="text-[18px] font-extrabold leading-none"
                      style={{ color: "#2B2B2B" }}
                    >
                      {day}
                    </p>
                    <p
                      className="mt-0.5 text-[9px] font-bold tracking-[0.08em]"
                      style={{ color: "#C6A56B" }}
                    >
                      {month}
                    </p>
                  </div>

                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-[5px] text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{
                      backgroundColor: "rgba(43,43,43,0.88)",
                      color: "#F8F5F0",
                    }}
                  >
                    {post.category}
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-5 pb-4 pt-5">
                  <h2
                    className="text-[17px] font-bold leading-[1.4]"
                    style={{
                      color: "#2B2B2B",
                      fontFamily: "Playfair Display, Georgia, serif",
                    }}
                  >
                    {post.title}
                  </h2>

                  <p
                    className="mb-3 mt-3 text-[11px]"
                    style={{ color: "#B8A89A" }}
                  >
                    Posted by{" "}
                    <span style={{ color: "#8C7355", fontWeight: 600 }}>
                      {post.author}
                    </span>
                  </p>

                  <p
                    className="mb-[18px] flex-1 text-[13px] leading-[1.65]"
                    style={{
                      color: "#7A6A5A",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {post.excerpt}
                  </p>

                  <div
                    className="mb-[14px] h-px"
                    style={{
                      background:
                        "linear-gradient(90deg, #C6A56B44, transparent)",
                    }}
                  />

                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] no-underline"
                    style={{ color: "#2B2B2B" }}
                  >
                    Continue Reading
                    <span style={{ color: "#C6A56B", fontSize: "14px" }}>
                      →
                    </span>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
