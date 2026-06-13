"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;         // e.g. "2025-07-11"
  image: string;        // URL
  author: string;
};

// ── Static blog data — replace or fetch from your CMS/DB later ───────────────

const BLOG_POSTS: BlogPost[] = [
  {
    slug: "right-skincare-product-for-your-skin",
    title: "Why the Right Skincare Product Matters for Your Specific Skin Concern",
    excerpt:
      "A luxury approach to intelligent beauty.",
    category: "Skin Care",
    date: "2025-07-11",
    image: "/hero/blog1.png",
    author: "Selenite Care",
  },
  {
    slug: "power-of-hydration-timeless-radiant-skin",
    title: "The Power of Hydration: The Secret to Timeless, Radiant Skin",
    excerpt:
      "When we speak of beauty, we often think of glow. Discover how deep hydration unlocks your skin's natural luminosity.",
    category: "Skin Care",
    date: "2025-07-11",
    image: "/hero/blog2.png",
    author: "Selenite Care",
  },
  {
    slug: "understanding-damaged-skin-causes-repair",
    title: "Understanding Damaged Skin: Causes, Repair, and Restoration",
    excerpt:
      "In the ever-demanding pace of modern life, our skin silently bears the brunt of stress, pollution, and harsh weather.",
    category: "Skin Care",
    date: "2025-07-17",
    image: "/hero/blog3.png",
    author: "Selenite Care",
  },
  // {
  //   slug: "building-a-morning-skincare-routine",
  //   title: "Building a Morning Skincare Routine That Actually Works",
  //   excerpt:
  //     "A consistent morning routine is the single highest-leverage habit for healthy skin. Here's how to build one that sticks.",
  //   category: "Routine",
  //   date: "2025-07-20",
  //   image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80&auto=format&fit=crop",
  //   author: "Selenite Care",
  // },
  // {
  //   slug: "nutrition-and-skin-health",
  //   title: "What You Eat Shows on Your Face: Nutrition and Skin Health",
  //   excerpt:
  //     "The connection between diet and skin is deeper than most realise. Learn which nutrients your skin craves most.",
  //   category: "Wellness",
  //   date: "2025-07-24",
  //   image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80&auto=format&fit=crop",
  //   author: "Selenite Care",
  // },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-US", { day: "2-digit" }),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
}

// ── Card ──────────────────────────────────────────────────────────────────────

function BlogCard({ post }: { post: BlogPost }) {
  const { day, month } = formatDate(post.date);

  return (
    <article
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8DDD5",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(198,165,107,0.18)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Image + date badge */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Image
          src={post.image}
          alt={post.title}
          width={800}
          height={440}
          style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
        />

        {/* Date badge — top-left */}
        <div
          style={{
            position: "absolute", top: 14, left: 14,
            background: "#FFFFFF",
            borderRadius: 6,
            padding: "6px 10px",
            textAlign: "center",
            minWidth: 46,
            boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 800, color: "#2B2B2B", lineHeight: 1, margin: 0 }}>
            {day}
          </p>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#C6A56B", letterSpacing: "0.08em", margin: "2px 0 0" }}>
            {month}
          </p>
        </div>

        {/* Category pill — bottom-center over image */}
        <div
          style={{
            position: "absolute", bottom: 0, left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(43,43,43,0.88)",
            color: "#F8F5F0",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "5px 16px",
            whiteSpace: "nowrap",
          }}
        >
          {post.category}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3
          style={{
            fontFamily: "Playfair Display, Georgia, serif",
            color: "#2B2B2B",
            fontSize: 17,
            fontWeight: 700,
            lineHeight: 1.4,
            margin: "0 0 10px",
          }}
        >
          {post.title}
        </h3>

        {/* Author row */}
        <p style={{ fontSize: 11, color: "#B8A89A", margin: "0 0 12px", letterSpacing: "0.02em" }}>
          Posted by{" "}
          <span style={{ color: "#8C7355", fontWeight: 600 }}>{post.author}</span>
        </p>

        <p
          style={{
            fontSize: 13,
            color: "#7A6A5A",
            lineHeight: 1.65,
            margin: "0 0 18px",
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.excerpt}
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg, #C6A56B44, transparent)", marginBottom: 14 }} />

        <Link
          href={`/blog/${post.slug}`}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#2B2B2B",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Continue Reading
          <span style={{ color: "#C6A56B", fontSize: 14 }}>→</span>
        </Link>
      </div>
    </article>
  );
}

// ── Main carousel component ───────────────────────────────────────────────────

export default function BlogCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section
      style={{ backgroundColor: "#F8F5F0", position: "relative", overflow: "hidden" }}
      className="px-6 py-16"
    >
      {/* Subtle warm background orb */}
      <div
        style={{
          position: "absolute", bottom: -60, right: -60, width: 320, height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(198,165,107,0.12) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl">
        {/* Header row */}
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2
              style={{ fontFamily: "Playfair Display, serif", color: "#2B2B2B" }}
              className="text-3xl font-bold tracking-tight"
            >
              Our Blogs &amp; Articles
            </h2>
            <p style={{ color: "#B8A89A" }} className="mt-3 text-base leading-7">
              Skincare insights, wellness guidance, and expert perspectives — written for you.
            </p>
          </div>

          {/* View All + Prev / Next buttons */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/blog"
              style={{ color: "#C6A56B" }}
              className="text-sm font-semibold transition-colors duration-200 hover:opacity-80"
            >
              View All
            </Link>
            <button
              onClick={scrollPrev}
              aria-label="Previous"
              style={{
                width: 42, height: 42, borderRadius: "50%",
                border: `1.5px solid ${canScrollPrev ? "#C6A56B" : "#D8C7B5"}`,
                background: canScrollPrev ? "#C6A56B" : "transparent",
                color: canScrollPrev ? "#FFF8EE" : "#B8A89A",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: canScrollPrev ? "pointer" : "default",
                transition: "all 0.2s ease",
                fontSize: 18,
              }}
            >
              ‹
            </button>
            <button
              onClick={scrollNext}
              aria-label="Next"
              style={{
                width: 42, height: 42, borderRadius: "50%",
                border: `1.5px solid ${canScrollNext ? "#C6A56B" : "#D8C7B5"}`,
                background: canScrollNext ? "#C6A56B" : "transparent",
                color: canScrollNext ? "#FFF8EE" : "#B8A89A",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: canScrollNext ? "pointer" : "default",
                transition: "all 0.2s ease",
                fontSize: 18,
              }}
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-4 sm:hidden">
          <Link
            href="/blog"
            style={{ color: "#C6A56B" }}
            className="text-sm font-semibold transition-colors duration-200 hover:opacity-80"
          >
            View All
          </Link>
        </div>

        {/* Carousel viewport */}
        <div className="mt-8 overflow-hidden" ref={emblaRef}>
          <div className="flex gap-5">
            {BLOG_POSTS.map((post) => (
              <div
                key={post.slug}
                style={{ flex: "0 0 calc(33.333% - 14px)", minWidth: 0 }}
                className="max-[768px]:!flex-[0_0_calc(85%-14px)] max-[480px]:!flex-[0_0_calc(92%-14px)]"
              >
                <BlogCard post={post} />
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="mt-6 flex justify-center gap-2">
          {BLOG_POSTS.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: selectedIndex === i ? 24 : 8,
                height: 8,
                borderRadius: 99,
                background: selectedIndex === i ? "#C6A56B" : "#D8C7B5",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Mobile prev/next */}
        <div className="mt-6 flex justify-center gap-4 sm:hidden">
          <button
            onClick={scrollPrev}
            style={{
              width: 42, height: 42, borderRadius: "50%",
              border: "1.5px solid #C6A56B", background: "transparent",
              color: "#C6A56B", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ‹
          </button>
          <button
            onClick={scrollNext}
            style={{
              width: 42, height: 42, borderRadius: "50%",
              border: "1.5px solid #C6A56B", background: "#C6A56B",
              color: "#FFF8EE", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
