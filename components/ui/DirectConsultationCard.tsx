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
  const isPriceAvailable = pricing.currentPrice > 0;
  const displayedPrice = isLoading
    ? "Loading..."
    : isPriceAvailable
      ? `${pricing.currentPrice.toLocaleString("en-US")} BDT`
      : "Price unavailable";

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
            : isPriceAvailable
              ? `Book Now - ${pricing.currentPrice.toLocaleString("en-US")} BDT`
              : "Price unavailable",
          href:
            isLoading || !isPriceAvailable
              ? undefined
              : "/one-time-consultation",
          disabled: isLoading || !isPriceAvailable,
        }}
      />

      {isDetailsOpen ? (
        <ProgramDetailsModal
          title="Online Video Consultation"
          subtitle="A focused one-time consultation with a skincare professional."
          benefits={BENEFITS}
          actionLabel={
            isPriceAvailable
              ? `Book Now - ${pricing.currentPrice.toLocaleString("en-US")} BDT`
              : "Price unavailable"
          }
          actionHref={isPriceAvailable ? "/one-time-consultation" : undefined}
          actionDisabled={!isPriceAvailable}
          onClose={() => setIsDetailsOpen(false)}
        />
      ) : null}
    </>
  );
}
