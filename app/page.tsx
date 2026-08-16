import Link from "next/link";
import { Gift } from "lucide-react";
import ViewportAnimatedSection from "@/components/ui/ViewportAnimatedSection";
import HeroSlider from "@/components/ui/HeroSlider";
import { FeatureCard } from "@/components/ui/MembershipCards";
import MembershipSection from "@/components/ui/MembershipSection";
import BlogCarousel from "@/components/ui/BlogCarousel";
import ProductSlideshow from "@/components/ui/ProductSlideshow";
import { db } from "@/lib/db";

export const revalidate = 3600;

const features = [
  { title: "Personalized Care",  description: "Support shaped around your needs, schedule, and goals.", icon: "✦" },
  { title: "Simple Booking",     description: "Choose a service, reserve a time, and get clear next steps.", icon: "◈" },
  { title: "Trusted Guidance",   description: "Thoughtful consultations focused on practical wellness.", icon: "❋" },
];

const reassurancePoints = [
  "Professional guidance that feels personal",
  "Calm, easy-to-follow booking experience",
  "Support designed for steady long-term progress",
];

const trustHighlights = [
  { label: "Client-first", value: "Tailored care" },
  { label: "Clear process", value: "No guesswork" },
  { label: "Thoughtful follow-up", value: "Steady support" },
];

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
  const [featuredProducts, discountSettings] = await Promise.all([
    getFeaturedProducts(),
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
      `}</style>

      {/* Hero Section */}
      <section className="relative h-[45svh] min-h-[350px] overflow-hidden sm:h-auto sm:min-h-[85vh]">
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
                className="pointer-events-none absolute right-5 top-4 h-2 w-2 rounded-full bg-[#B87B68]"
                style={{ animation: "productDiscountSparkle 1.9s ease-in-out infinite" }}
              />
              <span
                className="pointer-events-none absolute bottom-5 left-7 h-1.5 w-1.5 rounded-full bg-[#B87B68]"
                style={{ animation: "productDiscountSparkle 2.4s ease-in-out infinite" }}
              />

              <div className="relative flex items-start gap-3">
                <div className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B87B68] text-[#2B2B2B]">
                  <Gift className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p 
  className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFFFFF]"
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
            </Link>
          </>
        ) : null}
        <div className="relative z-10 px-4 py-20 sm:px-6 sm:py-32">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
{/* ── Headline — glitter-text class kept, with stronger shadow for image-bg contrast ── */}
<h1
  style={{
    fontFamily: "Playfair Display, serif",
    textShadow: "0 4px 24px rgba(0,0,0,.5), 0 1px 4px rgba(0,0,0,.5)",
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
                  className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-md border border-white bg-[var(--sidebar)] px-6 text-sm font-medium text-[var(--sidebar-text)] animate-pulse transition-all duration-300 hover:animate-none hover:scale-105 hover:opacity-90 sm:mt-8 sm:w-auto"
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductSlideshow products={featuredProducts} />

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
      <MembershipSection />

      {/* ── Why Choose Us ── */}
      <section
        style={{ position: "relative", overflow: "hidden" }}
        className="bg-card px-6 py-16 sm:py-20"
      >
        <div
          className="absolute -left-12 top-10 h-40 w-40 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(198,165,107,0.11)" }}
        />
        <div
          className="absolute bottom-0 right-0 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(216,199,181,0.16)" }}
        />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(rgba(198,165,107,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(198,165,107,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }} />

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-[#884F38] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#B87B68] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#D4B47A]">
                Why Clients Stay With Us
              </span>
              <h2
                style={{ fontFamily: "Playfair Display, serif" }}
                className="horizontal-nudge text-page mt-5 text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Why Choose Us
              </h2>
              <p className="text-muted mt-4 max-w-2xl text-base leading-7 sm:text-lg text-[#884F38] dark:text-[#8A7D75]">
                We&apos;re building a skincare and wellness experience that feels warm, structured, and genuinely supportive from the first click to ongoing care.
              </p>
            </div>

            <div className="border-themed bg-page rounded-3xl border p-5 shadow-[0_18px_40px_rgba(43,43,43,0.06)] dark:shadow-none">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B87B68] dark:text-[#D4B47A]">
                What You Can Expect
              </p>
              <ul className="mt-4 space-y-3">
                {reassurancePoints.map((point) => (
                  <li key={point} className="text-page flex items-start gap-3 text-sm leading-6">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[#B87B68] dark:bg-[#D4B47A]" />
                    <span className="text-[#884F38] dark:text-[#8A7D75]">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ViewportAnimatedSection className="feature-card-trigger mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} total={features.length} />
            ))}
          </ViewportAnimatedSection>

          <div className="mt-8 grid gap-4 rounded-[28px] border border-[#EADDCD] bg-white/75 p-4 shadow-[0_16px_34px_rgba(43,43,43,0.05)] dark:border-[#3D3530] dark:bg-[#242220]/90 dark:shadow-none md:grid-cols-3 md:p-5">
            {trustHighlights.map((item) => (
              <div
                key={item.label}
                className="border-themed rounded-2xl border bg-[#F8F5F0]/75 px-4 py-4 dark:bg-[#1A1814]/80"
              >
                <p className="text-muted text-xs font-semibold uppercase tracking-[0.16em] text-[#884F38] dark:text-[#8A7D75]">
                  {item.label}
                </p>
                <p
                  style={{ fontFamily: "Playfair Display, serif" }}
                  className="text-page mt-2 text-lg font-semibold"
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Blogs & Articles ── */}
      <BlogCarousel />
      <section className="px-6 py-20 bg-white dark:bg-[#242220]">
      <div className="mx-auto max-w-5xl text-center">
    <span
      className="text-sm font-medium uppercase tracking-[0.2em] text-[#B87B68] dark:text-[#D4B47A]"
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
