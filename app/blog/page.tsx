import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { formatDateOnly } from "@/lib/dateUtils";

export const revalidate = 3600;

function formatDateParts(iso: string) {
  const [month = "", dayWithComma = ""] = formatDateOnly(iso).split(" ");

  return {
    day: dayWithComma.replace(",", "").padStart(2, "0"),
    month: month.toUpperCase(),
  };
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="bg-page text-page min-h-screen px-6 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-7xl">
        <section className="max-w-3xl">
          <h1 className="text-page text-4xl font-bold tracking-tight sm:text-5xl" style={{ fontFamily: "Playfair Display, serif" }}>
            Our Blog
          </h1>
          <p className="text-muted mt-4 text-base leading-8 sm:text-lg">
            Skincare insights, wellness guidance, and expert perspectives.
          </p>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => {
            const { day, month } = formatDateParts(post.date);

            return (
              <article
                key={post.slug}
                className="bg-card border-themed flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(198,165,107,0.18)] dark:bg-[#242220] dark:border-[#3D3530] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              >
                <div className="relative flex-shrink-0">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={800}
                    height={440}
                    className="block h-[220px] w-full object-cover"
                  />

                  <div className="bg-card absolute left-4 top-4 min-w-[46px] rounded-md px-[10px] py-[6px] text-center shadow-[0_2px_10px_rgba(0,0,0,0.12)] dark:bg-[#242220] dark:border dark:border-[#3D3530]">
                    <p className="text-page text-[18px] font-extrabold leading-none">
                      {day}
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold tracking-[0.08em] text-[var(--gold)]">
                      {month}
                    </p>
                  </div>

                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-[5px] text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ backgroundColor: "var(--sidebar)", color: "var(--sidebar-text)" }}
                  >
                    {post.category}
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-5 pb-4 pt-5">
                  <h2 className="text-page text-[17px] font-bold leading-[1.4]" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                    {post.title}
                  </h2>

                  <p className="text-muted mb-3 mt-3 text-[11px]">
                    Posted by{" "}
                    <span className="font-semibold text-[var(--gold)]">
                      {post.author}
                    </span>
                  </p>

                  <p
                    className="mb-[18px] flex-1 text-[13px] leading-[1.65] dark:text-[#8A7D75]"
                    style={{
                      color: "var(--muted)",
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
                        "linear-gradient(90deg, #B87B6844, transparent)",
                    }}
                  />

                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] no-underline dark:text-[#F0EDE8]"
                    style={{ color: "#2B2B2B" }}
                  >
                    Continue Reading
                    <span style={{ color: "#B87B68", fontSize: "14px" }}>
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
