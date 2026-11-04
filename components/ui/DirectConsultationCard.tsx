"use client";

import { useState } from "react";
import ProgramDetailsModal from "@/components/ui/ProgramDetailsModal";
import ProgramOptionCard from "@/components/ui/ProgramOptionCard";
import type { OneTimeConsultationPricing } from "@/lib/oneTimeConsultationPricing";

const BENEFITS = [
  "Online video doctor consultation",
  "Root cause identification and guidance",
  "Personalized product recommendations",
];

export default function DirectConsultationCard({
  pricing,
  isLoading = false,
}: {
  pricing: OneTimeConsultationPricing;
  isLoading?: boolean;
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const displayedPrice = isLoading
    ? "Loading..."
    : `${pricing.currentPrice.toLocaleString("en-US")} BDT`;

  return (
    <>
      <ProgramOptionCard
        tone="consultation"
        badge="One-time consultation"
        title="Online Video Consultation"
        price={displayedPrice}
        originalPrice={
          !isLoading && pricing.isOfferActive
            ? `${pricing.originalPrice.toLocaleString("en-US")} BDT`
            : undefined
        }
        duration="Single session"
        paymentNote="One-time payment"
        offerBadge={
          !isLoading && pricing.isOfferActive && pricing.offerLabel
            ? `✨ ${pricing.offerLabel}`
            : undefined
        }
        benefits={BENEFITS}
        onViewDetails={() => setIsDetailsOpen(true)}
        primaryAction={{
          label: isLoading
            ? "Loading price..."
            : `Book Now - ${pricing.currentPrice.toLocaleString("en-US")} BDT`,
          href: isLoading ? undefined : "/one-time-consultation",
          disabled: isLoading,
        }}
      />

      {isDetailsOpen ? (
        <ProgramDetailsModal
          title="Online Video Consultation"
          subtitle="A focused one-time consultation with a skincare professional."
          benefits={BENEFITS}
          actionLabel={`Book Now - ${pricing.currentPrice.toLocaleString("en-US")} BDT`}
          actionHref="/one-time-consultation"
          onClose={() => setIsDetailsOpen(false)}
        />
      ) : null}
    </>
  );
}
