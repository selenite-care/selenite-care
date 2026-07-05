"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { formatDateOnly } from "@/lib/dateUtils";

const POSTS_PER_PAGE = 12;

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  tags: string[];
  publishedAt: string | null;
  views: number;
  author: {
    name: string | null;
  };
};

type BlogPostsResponse = {
  posts?: BlogPost[];
  error?: string;
};

function formatDateParts(iso: string) {
  const [month = "", dayWithComma = ""] = formatDateOnly(iso).split(" ");

  return {
    day: dayWithComma.replace(",", "").padStart(2, "0"),
    month: month.toUpperCase(),
  };
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

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/blog", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | BlogPostsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load blog posts.");
        }

        if (!isMounted) {
          return;
        }

        setPosts(data?.posts ?? []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load blog posts.",
        );
        setPosts([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      posts
        .map((post) => post.category?.trim())
        .filter((category): category is string => Boolean(category)),
    );

    return ["All", ...Array.from(uniqueCategories).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "All") {
      return posts;
    }

    return posts.filter((post) => post.category === selectedCategory);
  }, [posts, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  function handleCategoryChange(category: string) {
    setSelectedCategory(category);
    setCurrentPage(1);
  }

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

        <section className="mt-8 flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = selectedCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryChange(category)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-[#B87B68] bg-[#B87B68] text-[#F8F5F0]"
                    : "border-[#EADDCD] bg-card text-[#2B2B2B] hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </section>

        {error ? (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-card border-themed h-[460px] animate-pulse rounded-2xl border dark:bg-[#242220] dark:border-[#3D3530]"
              />
            ))}
          </section>
        ) : null}

        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {!isLoading && paginatedPosts.map((post) => {
            const { day, month } = formatDateParts(
              post.publishedAt ?? new Date().toISOString(),
            );

            return (
              <article
                key={post.slug}
                className="bg-card border-themed flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(198,165,107,0.18)] dark:bg-[#242220] dark:border-[#3D3530] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              >
                <div className="relative flex-shrink-0">
                  <Image
                    src={post.coverImage ?? "/hero/blog1.png"}
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
                    {post.category ?? "Skin Care"}
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-5 pb-4 pt-5">
                  <h2 className="text-page text-[17px] font-bold leading-[1.4]" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                    {post.title}
                  </h2>

                  <p className="text-muted mb-3 mt-3 text-[11px]">
                    Posted by{" "}
                    <span className="font-semibold text-[var(--gold)]">
                      {post.author.name ?? "Selenite Care"}
                    </span>
                  </p>

                  <p className="mb-3 text-[11px] text-[#8C7967] dark:text-[#8A7D75]">
                    👁 {formatViews(post.views)} views
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
                    {post.excerpt ?? ""}
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

        {!isLoading && filteredPosts.length === 0 ? (
          <div className="mt-10 rounded-xl border border-[#EADDCD] bg-card px-6 py-12 text-center dark:border-[#3D3530] dark:bg-[#242220]">
            <p className="text-page text-base font-semibold">
              No blog posts found
            </p>
          </div>
        ) : null}

        {!isLoading && filteredPosts.length > POSTS_PER_PAGE ? (
          <div className="mt-10">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredPosts.length}
              itemsPerPage={POSTS_PER_PAGE}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
