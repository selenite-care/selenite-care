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

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
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
              <p style={{ color: "#B8A89A" }} className="mt-6 text-lg leading-8">
                Schedule personalized support with Selenite Care and receive professional guidance tailored to your needs.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/services"
                  style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
                  className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-md border border-white px-6 text-sm font-medium animate-pulse transition-all duration-300 hover:animate-none hover:bg-[#B8A89A] hover:scale-105 sm:mt-8 sm:w-auto"
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
        style={{ backgroundColor: "#FFFFFF", position: "relative", overflow: "hidden" }}
        className="px-6 py-16"
      >
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(rgba(198,165,107,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(198,165,107,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }} />

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <h2
              style={{ fontFamily: "Playfair Display, serif", color: "#2B2B2B" }}
              className="horizontal-nudge text-3xl font-bold tracking-tight"
            >
              Why Choose Us
            </h2>
            <p style={{ color: "#B8A89A" }} className="mt-4 text-base leading-7">
              Care should feel clear, calm, and easy to access.
            </p>
          </div>

          <ViewportAnimatedSection className="feature-card-trigger mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} total={features.length} />
            ))}
          </ViewportAnimatedSection>
        </div>
      </section>

      {/* ── Our Blogs & Articles ── */}
      <BlogCarousel />
    </div>
  );
}
