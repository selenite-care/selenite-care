import Link from "next/link";
import { Award, ClipboardCheck, Gift, Headphones } from "lucide-react";
import HeroSlider from "@/components/ui/HeroSlider";
import MembershipSection from "@/components/ui/MembershipSection";
import BlogCarousel, { type BlogPost } from "@/components/ui/BlogCarousel";
import ProductSlideshow from "@/components/ui/ProductSlideshow";
import { db } from "@/lib/db";
import WhyChooseUsSection from "@/components/layout/WhyChooseUsSection";
import IngredientSpotlight from "@/components/layout/IngredientSpotlight";
import AMomentForYou from "@/components/layout/AMomentForYou";

export const revalidate = 3600;

type PublicDiscountSettings = {
  discountEnabled: boolean;
  discountPercent: number;
  discountLabel: string;
};

const DEFAULT_DISCOUNT_SETTINGS: PublicDiscountSettings = {
  discountEnabled: false,
  discountPercent: 0,
  discountLabel: "",
};

async function getFeaturedProducts() {
  return db.product.findMany({
    where: {
      isVisible: true,
    },
    select: {
      id: true,
      name: true,
      type: true,
      price: true,
      skinType: true,
      image: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
}

async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  try {
    const posts = await db.blogPost.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        category: true,
        publishedAt: true,
        author: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 8,
    });

    return posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      date: post.publishedAt?.toISOString() ?? null,
      image: post.coverImage,
      author: post.author.name ?? "Selenite Care",
    }));
  } catch {
    return [];
  }
}

async function getPublicDiscountSettings(): Promise<PublicDiscountSettings> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "");

  if (!baseUrl) {
    return DEFAULT_DISCOUNT_SETTINGS;
  }

  try {
    const response = await fetch(`${baseUrl}/api/settings/public`, {
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      return DEFAULT_DISCOUNT_SETTINGS;
    }

    const data = (await response.json()) as Partial<PublicDiscountSettings>;
    const discountPercent =
      typeof data.discountPercent === "number" &&
      Number.isFinite(data.discountPercent)
        ? Math.min(100, Math.max(0, data.discountPercent))
        : 0;

    return {
      discountEnabled: data.discountEnabled === true,
      discountPercent,
      discountLabel:
        typeof data.discountLabel === "string" ? data.discountLabel : "",
    };
  } catch {
    return DEFAULT_DISCOUNT_SETTINGS;
  }
}

export default async function Home() {
  const [featuredProducts, featuredBlogPosts, discountSettings] = await Promise.all([
    getFeaturedProducts(),
    getFeaturedBlogPosts(),
    getPublicDiscountSettings(),
  ]);
  const showProductDiscountBanner =
    discountSettings.discountEnabled && discountSettings.discountPercent > 0;
  const productDiscountLabel =
    discountSettings.discountLabel.trim() ||
    `${discountSettings.discountPercent}% OFF - Limited Time Offer on All Products!`;

  return (
    <div className="bg-page text-page flex flex-1 flex-col">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-18px) scale(1.04); }
        }
        @keyframes iceSheen {
          0%   { opacity: 0.18; transform: translateX(-100%) skewX(-15deg); }
          50%  { opacity: 0.32; }
          100% { opacity: 0.18; transform: translateX(200%) skewX(-15deg); }
        }
        @keyframes productDiscountShimmer {
          0%   { transform: translateX(-130%) skewX(-18deg); opacity: 0; }
          20%  { opacity: 0.28; }
          55%  { opacity: 0.5; }
          100% { transform: translateX(130%) skewX(-18deg); opacity: 0; }
        }
        @keyframes productDiscountSparkle {
          0%, 100% { opacity: 0.35; transform: scale(0.86); }
          50%      { opacity: 1; transform: scale(1.08); }
        }
        @keyframes heroPromoFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes heroPromoPulse {
          0%, 100% { box-shadow: 0 20px 55px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.36); }
          50%      { box-shadow: 0 28px 70px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.62), 0 0 34px rgba(198,165,107,0.38); }
        }
        @keyframes heroClickCueNudge {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(8px); }
        }
        @keyframes heroClickCueGlow {
          0%, 100% {
            text-shadow:
              0 0 8px rgba(212, 180, 122, 0.42),
              0 0 18px rgba(184, 123, 104, 0.32);
          }
          50% {
            text-shadow:
              0 0 12px rgba(255, 255, 255, 0.72),
              0 0 26px rgba(212, 180, 122, 0.68),
              0 0 40px rgba(184, 123, 104, 0.42);
          }
        }
        @keyframes heroClickCueSparkle {
          0%, 100% { opacity: 0.35; transform: scale(0.75) rotate(0deg); }
          50%      { opacity: 1; transform: scale(1.16) rotate(35deg); }
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative h-[50svh] min-h-[350px] overflow-hidden sm:h-auto sm:min-h-[85vh]">
        <HeroSlider />
        {showProductDiscountBanner ? (
          <>
            <Link
              href="/products"
              className="absolute right-4 top-6 z-20 hidden w-[300px] overflow-hidden rounded-2xl border border-white/35 bg-white/12 p-4 text-[#F8F5F0] shadow-2xl backdrop-blur-md transition-transform hover:-translate-y-1 lg:block"
              style={{
                animation:
                  "heroPromoFloat 4.8s ease-in-out infinite, heroPromoPulse 3.2s ease-in-out infinite",
              }}
            >
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-white/25 blur-xl"
                style={{ animation: "productDiscountShimmer 3.6s ease-in-out infinite" }}
              />
              <span
                className="pointer-events-none absolute right-5 top-4 h-2 w-2 rounded-full bg-[#FFFFF0]"
                style={{ animation: "productDiscountSparkle 1.9s ease-in-out infinite" }}
              />
              <span
                className="pointer-events-none absolute bottom-5 left-7 h-1.5 w-1.5 rounded-full bg-[#FFFFF0]"
                style={{ animation: "productDiscountSparkle 2.4s ease-in-out infinite" }}
              />

              <div className="relative flex items-start gap-3">
                <div className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B87B68] text-[#2B2B2B]">
                  <Gift className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p 
  className="text-xs font-bold uppercase tracking-[0.25em] text-[#FFFFFF]"
  style={{
    WebkitTextStroke: "1.5px rgba(0, 0, 0, 0.5)",
    paintOrder: "stroke",
  }}
>
  Product Offer
</p>
                  <p
                    className="mt-1 text-3xl font-black leading-none text-white"
                    style={{
                      textShadow: "0 2px 14px rgba(0,0,0,0.45)",
                    }}
                  >
                    {discountSettings.discountPercent}% OFF
                  </p>
                  <p className="mt-2 text-sm font-medium leading-5 text-white/85">
                    See all our products
                  </p>
                  <p
                    className="relative mt-3 inline-flex items-center gap-1 text-2xl font-black tracking-[0.18em] text-[#D4B47A]"
                    style={{
                      animation:
                        "heroClickCueNudge 1.4s ease-in-out infinite, heroClickCueGlow 1.8s ease-in-out infinite",
                    }}
                    aria-hidden="true"
                  >
                    <span>{">>>"}</span>
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/products"
              className="absolute right-4 top-5 z-20 inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/35 bg-white/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-xl backdrop-blur-md lg:hidden"
              style={{ animation: "heroPromoPulse 3.2s ease-in-out infinite" }}
            >
              <span
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-white/25 blur-lg"
                style={{ animation: "productDiscountShimmer 3.6s ease-in-out infinite" }}
              />
              <Gift className="relative h-4 w-4 text-[#B87B68]" aria-hidden="true" />
              <span className="relative">{discountSettings.discountPercent}% OFF Products</span>
              <span
                className="relative inline-flex items-center text-sm font-black tracking-[0.12em] text-[#D4B47A]"
                style={{
                  animation:
                    "heroClickCueNudge 1.4s ease-in-out infinite, heroClickCueGlow 1.8s ease-in-out infinite",
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-white"
                  style={{ animation: "heroClickCueSparkle 1.7s ease-in-out infinite" }}
                />
                {">>>"}
              </span>
            </Link>
          </>
        ) : null}
        <div className="relative z-10 px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
{/* ── Headline — glitter-text class kept, with stronger shadow for image-bg contrast ── */}
<h1
  style={{
    fontFamily: "Playfair Display, serif",
    textShadow: "0 6px 30px rgba(0,0,0,.42), 0 1px 6px rgba(0,0,0,.35)",
  }}
  className="glitter-text text-4xl font-bold tracking-tight md:text-6xl [-webkit-text-stroke:0.2px_white] leading-[1.1]"
>
  Compassionate care for your everyday wellness.
</h1>

{/* ── Subtext — drop shadow keeps it readable over any part of the slider ── */}
<p
  style={{
    textShadow: "0 2px 12px rgba(0,0,0,0.4)",
  }}
  className="mt-6 max-w-xl text-lg leading-8 text-[#F0EDE6]/90"
>
  Schedule personalized support with Selenite Care and receive professional guidance tailored to your needs.
</p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/services"
                  className="mt-2 inline-flex min-h-14 w-full items-center justify-center rounded-full border border-white bg-[var(--sidebar)] px-10 py-4 text-sm font-semibold text-[var(--sidebar-text)] animate-pulse transition-all duration-300 hover:animate-none hover:scale-105 hover:opacity-90 sm:mt-8 sm:w-auto"
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#D8C7B5] bg-[#B87B68] px-6 py-4 text-[#2B2B2B] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 text-center text-sm font-semibold sm:flex-row sm:gap-5">
          <span className="inline-flex items-center gap-2">
            <Award className="h-4 w-4 text-[#D8C7B5] dark:text-[#D4B47A]" aria-hidden="true" />
            Certified Aestheticians
          </span>
          <span className="hidden text-[#D8C7B5] dark:text-[#8A7D75] sm:inline">
            {"·"}
          </span>
          <span className="inline-flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[#D8C7B5] dark:text-[#D4B47A]" aria-hidden="true" />
            Personalized Plans
          </span>
          <span className="hidden text-[#D8C7B5] dark:text-[#8A7D75] sm:inline">
            {"·"}
          </span>
          <span className="inline-flex items-center gap-2">
            <Headphones className="h-4 w-4 text-[#D8C7B5] dark:text-[#D4B47A]" aria-hidden="true" />
            Online & Offline Support
          </span>
        </div>
      </section>

      <div className="h-px w-full bg-[#D8C7B5] dark:bg-[#3D3530]" />

      <ProductSlideshow
        products={featuredProducts}
        discountEnabled={showProductDiscountBanner}
        discountPercent={discountSettings.discountPercent}
      />

      <div className="h-px w-full bg-[#D8C7B5] dark:bg-[#3D3530]" />

      {showProductDiscountBanner ? (
        <section className="relative overflow-hidden bg-[#B87B68] px-6 py-12 text-[#2B2B2B] dark:bg-[#D4B47A] dark:text-[#141210]">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-white/30 blur-2xl"
            style={{ animation: "productDiscountShimmer 4s ease-in-out infinite" }}
          />
          <span
            className="pointer-events-none absolute left-[12%] top-6 h-2 w-2 rounded-full bg-white/80"
            style={{ animation: "productDiscountSparkle 2.4s ease-in-out infinite" }}
          />
          <span
            className="pointer-events-none absolute bottom-7 right-[16%] h-2.5 w-2.5 rounded-full bg-white/70"
            style={{ animation: "productDiscountSparkle 3s ease-in-out infinite" }}
          />

          <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#2B2B2B] text-[#F8F5F0] shadow-[0_16px_34px_rgba(43,43,43,0.18)]">
              <Gift className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2
              className="mt-5 text-3xl font-black leading-tight sm:text-4xl"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {productDiscountLabel}
            </h2>
            <p className="mt-3 text-base font-medium leading-7">
              Shop now and save on all skincare products
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-[#2B2B2B] px-7 text-sm font-semibold text-[#F8F5F0] transition-transform hover:-translate-y-0.5 hover:bg-[#3A3734]"
            >
              Shop Now
            </Link>
          </div>
        </section>
      ) : null}

      {/* ── Our Memberships ── */}
      {showProductDiscountBanner ? (
        <div className="h-px w-full bg-[#D8C7B5] dark:bg-[#3D3530]" />
      ) : null}

      <MembershipSection />
      <div className="h-px w-full bg-[#D8C7B5] dark:bg-[#3D3530]" />
      <AMomentForYou />
      <div className="h-px w-full bg-[#D8C7B5] dark:bg-[#3D3530]" />
      <IngredientSpotlight />
      <div className="h-px w-full bg-[#D8C7B5] dark:bg-[#3D3530]" />
      <WhyChooseUsSection />

      {/* ── Our Blogs & Articles ── */}
      <BlogCarousel posts={featuredBlogPosts} />
      <div className="h-px w-full bg-[#D8C7B5] dark:bg-[#3D3530]" />
      <section className="bg-white px-6 py-20 dark:bg-[#242220] lg:py-24">
      <div className="mx-auto max-w-5xl text-center">
    <span
      className="text-sm font-medium uppercase tracking-[0.25em] text-[#B87B68] dark:text-[#D4B47A]"
    >
      Client Community
    </span>
    <h2
      className="mt-4 text-4xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8]"
      style={{ fontFamily: "Playfair Display, serif" }}
    >
      Join Our Private Wellness Community
    </h2>
    <p
      className="mx-auto mt-6 max-w-2xl text-lg text-[#884F38] dark:text-[#8A7D75]"
    >
      Connect with other members, share your skincare journey,
      read real experiences, and receive exclusive wellness updates.
    </p>
    
      <a href="https://www.facebook.com/groups/1487525968606577/"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-8 inline-flex h-12 items-center justify-center rounded-md px-8 text-sm font-medium bg-[#1877F2] text-white hover:bg-[#1666d8] transition-colors"
    >
      Join Facebook Community
    </a>
  </div>
    </section>
    </div>
  );
}
