"use client";

import ProgramOptionCard from "@/components/ui/ProgramOptionCard";

type Step = {
  title: string;
  validity: string;
  cost: string;
  originalCost?: string;
  discountBadge?: string;
  priceNote?: string;
  statusBadge?: string;
  description: string;
  tier: string;
};

export function MembershipCard({
  step,
  benefits,
  actionLabel,
  actionHref,
  actionDisabled = false,
  onViewDetails,
}: {
  step: Step;
  benefits: readonly string[];
  actionLabel: string;
  actionHref?: string;
  actionDisabled?: boolean;
  onViewDetails: () => void;
}) {
  return (
    <ProgramOptionCard
      tone="signature"
      badge={step.tier === "signature" ? "3 Months Guidance" : step.tier}
      title={step.title}
      price={step.cost}
      originalPrice={step.originalCost}
      duration={step.validity}
      paymentNote={step.priceNote}
      offerBadge={step.discountBadge}
      statusBadge={step.statusBadge}
      benefits={benefits}
      onViewDetails={onViewDetails}
      primaryAction={{
        label: actionLabel,
        href: actionHref,
        disabled: actionDisabled,
      }}
    />
  );
}

type Feature = { title: string; description: string; icon: string };

export function FeatureCard({
  feature,
  index,
  total,
}: {
  feature: Feature;
  index: number;
  total: number;
}) {
  return (
    <article
      style={{
        animationDelay: `${(total - 1 - index) * 400}ms`,
        borderRadius: 16,
        padding: "28px 24px",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
      }}
      className="feature-card-slide-in group border border-[#EADDCD] bg-white dark:border-[#3D3530] dark:bg-[#242220]"
      onMouseEnter={(event) => {
        event.currentTarget.style.boxShadow =
          "0 12px 40px rgba(198,165,107,0.18)";
        event.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.boxShadow = "none";
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(198,165,107,0.08) 0%, transparent 70%)",
          transition: "transform 0.4s ease",
          pointerEvents: "none",
        }}
        className="group-hover:scale-150"
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "20%",
          width: 3,
          height: "60%",
          background:
            "linear-gradient(180deg, transparent, #B87B68, transparent)",
          borderRadius: 99,
          opacity: 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }}
        className="group-hover:opacity-100"
      />

      <div className="flex items-start justify-between gap-4">
        <div
          style={{
            width: 46,
            height: 46,
            background: "linear-gradient(135deg, #B87B68 0%, #a8864d 100%)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: "#FFF8EE",
            boxShadow: "0 4px 16px rgba(198,165,107,0.3)",
          }}
        >
          {feature.icon}
        </div>

        <span className="rounded-full border border-[#EADDCD] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#884F38] dark:border-[#3D3530] dark:text-[#8A7D75]">
          0{index + 1}
        </span>
      </div>

      <h3
        className="mt-5 text-[18px] font-bold text-[#2B2B2B] dark:text-[#F0EDE8]"
        style={{ fontFamily: "Playfair Display, Georgia, serif" }}
      >
        {feature.title}
      </h3>
      <div className="mt-4 h-px w-14 rounded-full bg-gradient-to-r from-[#B87B68] to-transparent" />
      <p className="mt-4 text-[13px] leading-7 text-[#6E6257] dark:text-[#8A7D75]">
        {feature.description}
      </p>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87B68] dark:text-[#D4B47A]">
        Thoughtful care, clearly delivered
      </p>
    </article>
  );
}
