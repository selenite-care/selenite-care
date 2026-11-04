"use client";

import { useState } from "react";
import ProgramDetailsModal from "@/components/ui/ProgramDetailsModal";
import ProgramOptionCard from "@/components/ui/ProgramOptionCard";
import { CLASSIC_MEMBERSHIP_BENEFITS } from "@/lib/membershipDiscounts";

export default function ClassicMembershipCard({ price }: { price: number }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <>
      <ProgramOptionCard
        tone="classic"
        badge="1 Month Guidance"
        title="Classic Membership"
        price={`${price.toLocaleString("en-US")} BDT`}
        duration="Valid for 1 month"
        benefits={CLASSIC_MEMBERSHIP_BENEFITS}
        onViewDetails={() => setIsDetailsOpen(true)}
        primaryAction={{
          label: "Get Classic Membership",
          href: "/membership/payment?tier=CLASSIC",
        }}
      />

      {isDetailsOpen ? (
        <ProgramDetailsModal
          title="Classic Membership"
          subtitle="One month of focused guidance for clients beginning their skincare journey."
          benefits={CLASSIC_MEMBERSHIP_BENEFITS}
          actionLabel="Get Classic Membership"
          actionHref="/membership/payment?tier=CLASSIC"
          onClose={() => setIsDetailsOpen(false)}
        />
      ) : null}
    </>
  );
}
