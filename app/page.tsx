import Link from "next/link";
import ViewportAnimatedSection from "@/components/ui/ViewportAnimatedSection";
import HeroSlider from "@/components/ui/HeroSlider";
import { FeatureCard } from "@/components/ui/MembershipCards";
import MembershipSection from "@/components/ui/MembershipSection";
import BlogCarousel from "@/components/ui/BlogCarousel";

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

export default function Home() {
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
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] overflow-hidden">
        <HeroSlider />
        <div className="relative z-10 px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              <h1
                style={{ fontFamily: "Playfair Display, serif" }}
                className="glitter-text text-3xl font-bold tracking-tight md:text-5xl [-webkit-text-stroke:0.1px_white]"
              >
                Compassionate care for your everyday wellness.
              </h1>
              <p className="text-muted mt-6 text-lg leading-8">
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
              <span className="inline-flex rounded-full border border-[#D8C7B5] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#C6A56B] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#D4B47A]">
                Why Clients Stay With Us
              </span>
              <h2
                style={{ fontFamily: "Playfair Display, serif" }}
                className="horizontal-nudge text-page mt-5 text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Why Choose Us
              </h2>
              <p className="text-muted mt-4 max-w-2xl text-base leading-7 sm:text-lg">
                We&apos;re building a skincare and wellness experience that feels warm, structured, and genuinely supportive from the first click to ongoing care.
              </p>
            </div>

            <div className="border-themed bg-page rounded-3xl border p-5 shadow-[0_18px_40px_rgba(43,43,43,0.06)] dark:shadow-none">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C6A56B] dark:text-[#D4B47A]">
                What You Can Expect
              </p>
              <ul className="mt-4 space-y-3">
                {reassurancePoints.map((point) => (
                  <li key={point} className="text-page flex items-start gap-3 text-sm leading-6">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[#C6A56B] dark:bg-[#D4B47A]" />
                    <span>{point}</span>
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

          <div className="mt-8 grid gap-4 rounded-[28px] border border-[#D8C7B5] bg-white/75 p-4 shadow-[0_16px_34px_rgba(43,43,43,0.05)] dark:border-[#3D3530] dark:bg-[#242220]/90 dark:shadow-none md:grid-cols-3 md:p-5">
            {trustHighlights.map((item) => (
              <div
                key={item.label}
                className="border-themed rounded-2xl border bg-[#F8F5F0]/75 px-4 py-4 dark:bg-[#1A1814]/80"
              >
                <p className="text-muted text-xs font-semibold uppercase tracking-[0.16em]">
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
      className="text-sm font-medium uppercase tracking-[0.2em] text-[#C6A56B] dark:text-[#D4B47A]"
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
      className="mx-auto mt-6 max-w-2xl text-lg text-[#B8A89A] dark:text-[#8A7D75]"
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
