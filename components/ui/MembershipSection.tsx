"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getMembershipAvailabilityLabel,
  isMembershipAvailable,
} from "@/lib/membershipAvailability";
import {
  isSignatureOfferValid,
  MEMBERSHIP_PRICES,
} from "@/lib/membershipDiscounts";
import DirectConsultationCard from "@/components/ui/DirectConsultationCard";
import ClassicMembershipCard from "@/components/ui/ClassicMembershipCard";
import ProgramDetailsModal from "@/components/ui/ProgramDetailsModal";
import ViewportAnimatedSection from "@/components/ui/ViewportAnimatedSection";
import { MembershipCard } from "@/components/ui/MembershipCards";
import type { OneTimeConsultationPricing } from "@/lib/oneTimeConsultationPricing";

function formatBdt(amount: number) {
  return `${amount.toLocaleString("en-US")} BDT`;
}

const signatureOfferIsActive = isSignatureOfferValid();
const signatureCurrentPrice = signatureOfferIsActive
  ? MEMBERSHIP_PRICES.SIGNATURE.price
  : (MEMBERSHIP_PRICES.SIGNATURE.originalPrice ?? MEMBERSHIP_PRICES.SIGNATURE.price);
const signatureOriginalPrice = signatureOfferIsActive
  ? MEMBERSHIP_PRICES.SIGNATURE.originalPrice
  : null;

const steps = [
  {
    title: "Signature Membership",
    validity: "Valid for 3 Months",
    cost: formatBdt(signatureCurrentPrice),
    originalCost: signatureOriginalPrice
      ? formatBdt(signatureOriginalPrice)
      : undefined,
    discountBadge: signatureOfferIsActive ? "55% OFF" : undefined,
    priceNote: signatureOfferIsActive
      ? "For limited time"
      : undefined,
    description:
      "A perfect starting point for individuals seeking professional skincare guidance and routine development.",
    tier: "signature",
  },
  /* CRYSTAL_MEMBERSHIP_START
  {
    title: "Crystal Membership",
    validity: "Valid for 12 Months",
    cost: formatBdt(MEMBERSHIP_PRICES.CRYSTAL.price),
    discountBadge: `${getProductDiscount("CRYSTAL")}% OFF on All Products`,
    priceNote: "Product discount valid throughout membership",
    description:
      "Designed for individuals committed to achieving long-term skin improvement through regular monitoring and expert guidance.",
    tier: "crystal",
  },
  CRYSTAL_MEMBERSHIP_END */
  /* PLATINUM_MEMBERSHIP_START
  {
    title: "Platinum Membership",
    validity: "Valid for 36 Months",
    cost: formatBdt(MEMBERSHIP_PRICES.PLATINUM.price),
    discountBadge: `${getProductDiscount("PLATINUM")}% OFF on All Products`,
    priceNote: "Product discount valid throughout membership",
    description:
      "Excellence Skin transformation program combining skincare, nutrition, wellness, and continuous progress monitoring.",
    tier: "platinum",
  },
  PLATINUM_MEMBERSHIP_END */
];

type BenefitItem = {
  heading: string;
  points: string[];
};

type MembershipTier = {
  key: "classic" | "signature" | "crystal" | "platinum";
  tierValue: "CLASSIC" | "SIGNATURE" | "CRYSTAL" | "PLATINUM";
  title: string;
  validity: string;
  cost: string;
  originalCost?: string;
  discountBadge?: string;
  priceNote?: string;
  description: string;
  accentColor: string;
  benefits: BenefitItem[];
};

type ClientMembership = {
  tier: "CLASSIC" | "SIGNATURE" | "CRYSTAL" | "PLATINUM";
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  expiresAt: string | null;
};

type MembershipResponse = {
  membership?: ClientMembership | null;
  error?: string;
};

type MembershipActionState = {
  disabled: boolean;
  href: string | null;
  label: string;
};

const TIER_ORDER = {
  CLASSIC: 0,
  SIGNATURE: 1,
  CRYSTAL: 2,
  PLATINUM: 3,
} as const;

const memberships: MembershipTier[] = [
  {
    key: "signature",
    tierValue: "SIGNATURE",
    title: "Signature Membership",
    validity: "Valid for 3 Months",
    cost: formatBdt(signatureCurrentPrice),
    originalCost: signatureOriginalPrice
      ? formatBdt(signatureOriginalPrice)
      : undefined,
    discountBadge: signatureOfferIsActive ? "55% OFF" : undefined,
    priceNote: signatureOfferIsActive
      ? "For limited time"
      : undefined,
    description:
      "A perfect starting point for individuals seeking professional skincare guidance and routine development.",
    accentColor: "#B87B68",
    benefits: [
      {
        heading: "Online Doctor Video Consultation",
        points: [],
      },
      {
        heading: "Skin, Body & Hair Problem Analysis & Root Cause Identification",
        points: [
          "Self-submitted photo review",
          "Online skin assessment form",
        ],
      },
      {
        heading: "Right Product Suggestions for Your Skin",
        points: ["Proper benefits explained for every suggested product"],
      },
      {
        heading: "3 Months General Doctor Guidance & Follow-up",
        points: [],
      },
      { heading: "24/7 Client Support", points: [] },
      { heading: "Skin Report Card", points: [] },
      {
        heading: "Personalized Morning & Night Skincare Routine (after purchasing products from Selenite)",
        points: [],
      },
    ],
  },
  /* CRYSTAL_MEMBERSHIP_START
  {
    key: "crystal",
    tierValue: "CRYSTAL",
    title: "Crystal Membership",
    validity: "Valid for 12 Months",
    cost: formatBdt(MEMBERSHIP_PRICES.CRYSTAL.price),
    discountBadge: `${getProductDiscount("CRYSTAL")}% OFF on All Products`,
    priceNote: "Product discount valid throughout membership",
    description:
      "Designed for individuals committed to achieving long-term skin improvement through regular monitoring and expert guidance.",
    accentColor: "#4B9DD3",
    benefits: [
      { heading: "1 Year Specialist Support (Online & Offline)", points: [] },
      {
        heading: "Specialist Access",
        points: [
          "Aesthetician Consultation",
          "Nutritionist Consultation",
          "Psychiatrist Consultation",
        ],
      },
      { heading: "Personalized Support", points: ["12 Months of Online Support"] },
      {
        heading: "Advanced Skin, Body & Hair Problem Assessment",
        points: [
          "Detailed Skin Analysis",
          "Problem Identification and Concern Mapping",
          "Covering Acne, Pigmentation, Dehydration, Sensitivity, Dullness, Other Skin Concerns",
        ],
      },
      {
        heading: "Lifestyle Evaluation",
        points: ["Lifestyle & Skincare Habit Review"],
      },
      {
        heading: "Customized Care Plan",
        points: [
          "Personalized Product Recommendation List",
          "Skin Report Card",
          "Personalized Morning & Night Skincare Routine (after purchasing products from Selenite)",
        ],
      },
    ],
  },
  CRYSTAL_MEMBERSHIP_END */
  /* PLATINUM_MEMBERSHIP_START
  {
    key: "platinum",
    tierValue: "PLATINUM",
    title: "Platinum Membership",
    validity: "Valid for 36 Months",
    cost: formatBdt(MEMBERSHIP_PRICES.PLATINUM.price),
    discountBadge: `${getProductDiscount("PLATINUM")}% OFF on All Products`,
    priceNote: "Product discount valid throughout membership",
    description:
      "Excellence Skin transformation program combining skincare, nutrition, wellness, and continuous progress monitoring.",
    accentColor: "#B87B68",
    benefits: [
      { heading: "3 Years Specialist Support on both Online & Offline", points: [] },
      {
        heading: "5% off on Product Purchase for Validate Time of Membership",
        points: [],
      },
      {
        heading: "Specialist Access",
        points: [
          "Aesthetician Consultation",
          "Nutritionist Consultation",
          "Psychiatrist Consultation",
        ],
      },
      { heading: "Premium Support", points: ["36 Months of Online Support"] },
      {
        heading: "Advanced Skin, Body & Hair Problem Mapping & Analysis",
        points: [
          "Deep Skin Concern Analysis",
          "Trigger Identification",
          "Skin Barrier Assessment",
        ],
      },
      {
        heading: "Psychological Wellness Review",
        points: ["Stress Level Assessment", "Lifestyle Impact Analysis"],
      },
      {
        heading: "Nutritional Assessment",
        points: [
          "Nutritional Value Analysis",
          "Diet & Skin Health Evaluation",
        ],
      },
      {
        heading: "Customized Care Plan",
        points: [
          "Personalized Product Recommendation List",
          "Skin Report Card",
          "Personalized Morning & Night Skincare Routine (after purchasing products from Selenite)",
        ],
      },
      {
        heading: "Skin Transformation Program",
        points: [
          "Skin Transformation Roadmap every 60 Days",
          "Product Layering Strategy",
          "Seasonal Skincare Adjustments",
        ],
      },
      {
        heading: "Progress Monitoring",
        points: [
          "Professional Before-and-After Documentation",
          "Monthly Skin Scoring",
          "Routine Modifications Based on Skin Progress",
          "Continuous Improvement Tracking",
        ],
      },
    ],
  },
  PLATINUM_MEMBERSHIP_END */
];

function MembershipModal({
  membership,
  onClose,
  actionState,
}: {
  membership: MembershipTier;
  onClose: () => void;
  actionState: MembershipActionState;
}) {
  const benefits = membership.benefits.flatMap((benefit) => [
    benefit.heading,
    ...benefit.points,
  ]);

  return (
    <ProgramDetailsModal
      title={membership.title}
      subtitle={membership.description}
      benefits={benefits}
      actionLabel={actionState.label}
      actionHref={actionState.href ?? undefined}
      actionDisabled={actionState.disabled}
      onClose={onClose}
    />
  );
}

export default function MembershipSection({
  oneTimeConsultation,
  classicPrice,
}: {
  oneTimeConsultation: OneTimeConsultationPricing;
  classicPrice: number;
}) {
  const { data: session } = useSession();
  const [selectedMembership, setSelectedMembership] = useState<MembershipTier | null>(
    null,
  );
  const [clientMembership, setClientMembership] = useState<ClientMembership | null>(
    null,
  );
  const [isMembershipLoading, setIsMembershipLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCurrentTime(Date.now());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadMembership() {
      if (!session?.user) {
        setClientMembership(null);
        return;
      }

      setIsMembershipLoading(true);

      try {
        const response = await fetch("/api/client/membership");
        const data = (await response.json().catch(() => null)) as
          | MembershipResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load membership.");
        }

        if (isMounted) {
          setClientMembership(data?.membership ?? null);
        }
      } catch {
        if (isMounted) {
          setClientMembership(null);
        }
      } finally {
        if (isMounted) {
          setIsMembershipLoading(false);
        }
      }
    }

    loadMembership();

    return () => {
      isMounted = false;
    };
  }, [session?.user]);

  function getMembershipActionState(
    membership: MembershipTier,
  ): MembershipActionState {
    if (!session?.user) {
      if (!isMembershipAvailable(membership.tierValue)) {
        return {
          disabled: true,
          href: null,
          label: "Available Soon",
        };
      }

      return {
        disabled: false,
        href: "/login?callbackUrl=/services",
        label: `Get ${membership.title}`,
      };
    }

    if (isMembershipLoading) {
      return {
        disabled: true,
        href: null,
        label: "Checking Plan...",
      };
    }

    if (!isMembershipAvailable(membership.tierValue)) {
      return {
        disabled: true,
        href: null,
        label: "Available Soon",
      };
    }

    const hasActiveMembership =
      clientMembership?.status === "ACTIVE" &&
      !!clientMembership.expiresAt &&
      new Date(clientMembership.expiresAt).getTime() > currentTime;

    if (!hasActiveMembership || !clientMembership) {
      return {
        disabled: false,
        href: `/membership/payment?tier=${membership.tierValue}`,
        label: `Get ${membership.title}`,
      };
    }

    const currentTierRank = TIER_ORDER[clientMembership.tier];
    const selectedTierRank = TIER_ORDER[membership.tierValue];

    if (selectedTierRank > currentTierRank) {
      return {
        disabled: false,
        href: `/membership/payment?tier=${membership.tierValue}`,
        label: "Upgrade to this Membership",
      };
    }

    if (selectedTierRank === currentTierRank) {
      return {
        disabled: true,
        href: null,
        label: "Current Plan",
      };
    }

    return {
      disabled: true,
      href: null,
      label: "Lower Plan",
    };
  }

  return (
    <>
      <section
        style={{ position: "relative", overflow: "hidden" }}
        className="bg-page px-6 py-16"
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
              style={{ fontFamily: "Playfair Display, serif" }}
              className="horizontal-nudge text-page text-3xl font-bold tracking-tight"
            >
              Our SkinCare Programs
            </h2>
            <p className="text-muted mt-4 text-base leading-7 text-[#884F38] dark:text-[#8A7D75]">
              We have membership plan categories. You can choose your own.
            </p>
          </div>

          <ViewportAnimatedSection className="step-card-trigger mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <DirectConsultationCard pricing={oneTimeConsultation} />
            <ClassicMembershipCard price={classicPrice} />
            {steps.map((step, index) => {
              const membership = memberships[index];
              const actionState = getMembershipActionState(membership);

              return (
                <MembershipCard
                  key={step.title}
                  step={{
                    ...step,
                    statusBadge: !isMembershipAvailable(membership.tierValue)
                      ? getMembershipAvailabilityLabel(membership.tierValue)
                      : undefined,
                  }}
                  benefits={membership.benefits.map((benefit) => benefit.heading)}
                  actionLabel={actionState.label}
                  actionHref={actionState.href ?? undefined}
                  actionDisabled={actionState.disabled}
                  onViewDetails={() => setSelectedMembership(membership)}
                />
              );
            })}
          </ViewportAnimatedSection>
        </div>
      </section>

      {selectedMembership ? (
        <MembershipModal
          membership={selectedMembership}
          actionState={getMembershipActionState(selectedMembership)}
          onClose={() => setSelectedMembership(null)}
        />
      ) : null}
    </>
  );
}
