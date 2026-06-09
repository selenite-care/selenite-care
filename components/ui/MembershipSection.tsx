"use client";

import Link from "next/link";
import ViewportAnimatedSection from "@/components/ui/ViewportAnimatedSection";
import { MembershipCard } from "@/components/ui/MembershipCards";

const steps = [
  {
    title: "Signature Membership",
    validity: "Valid for 3 Months",
    cost: "BDT 490",
    description:
      "A perfect starting point for individuals seeking professional skincare guidance and routine development.",
    tier: "signature",
  },
  {
    title: "Crystal Membership",
    validity: "Valid for 12 Months",
    cost: "BDT 2,900",
    description:
      "Designed for individuals committed to achieving long-term skin improvement through regular monitoring and expert guidance.",
    tier: "crystal",
  },
  {
    title: "Platinum Membership",
    validity: "Valid for 36 Months",
    cost: "BDT 6,900",
    description:
      "A complete skin transformation program combining skincare, nutrition, wellness, and continuous progress monitoring.",
    tier: "platinum",
  },
];

export default function MembershipSection() {
  return (
    <section
      style={{ backgroundColor: "#F8F5F0", position: "relative", overflow: "hidden" }}
      className="px-6 py-16"
    >
      <div
        style={{
          position: "absolute",
          top: -60,
          left: -80,
          width: 340,
          height: 340,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(198,165,107,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "floatOrb 7s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          right: -60,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,210,255,0.14) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "floatOrb 9s ease-in-out infinite 2s",
          pointerEvents: "none",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <h2
            style={{ fontFamily: "Playfair Display, serif", color: "#2B2B2B" }}
            className="horizontal-nudge text-3xl font-bold tracking-tight"
          >
            Our Memberships
          </h2>
          <p style={{ color: "#B8A89A" }} className="mt-4 text-base leading-7">
            We have 3 membership plan categories. You can choose your own membership.
          </p>
        </div>

        <ViewportAnimatedSection className="step-card-trigger mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <Link
              key={step.title}
              href="/services"
              className="block cursor-pointer"
              style={{ borderRadius: 20 }}
            >
              <MembershipCard step={step} index={index} footerText="View Details ->" />
            </Link>
          ))}
        </ViewportAnimatedSection>
      </div>
    </section>
  );
}
