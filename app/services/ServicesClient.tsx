"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getMembershipAvailabilityLabel,
  isMembershipAvailable,
} from "@/lib/membershipAvailability";
import { trackViewMembership } from "@/lib/analytics";
import { isSignatureOfferValid } from "@/lib/membershipDiscounts";
import DoctorMascot from "@/components/ui/DoctorMascot";
import DirectConsultationCard from "@/components/ui/DirectConsultationCard";
import ClassicMembershipCard from "@/components/ui/ClassicMembershipCard";
import ProgramDetailsModal from "@/components/ui/ProgramDetailsModal";
import { MembershipCard } from "@/components/ui/MembershipCards";
import type { OneTimeConsultationPricing } from "@/lib/oneTimeConsultationPricing";

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

export type ServicesMembershipPrices = Record<
  ClientMembership["tier"],
  {
    price: number;
    originalPrice: number | null;
  }
>;

type MembershipResponse = {
  membership?: ClientMembership | null;
  error?: string;
};

type MembershipActionState = {
  disabled: boolean;
  href: string | null;
  label: string;
};

function formatBdt(amount: number) {
  return `${amount.toLocaleString("en-US")} BDT`;
}

const TIER_ORDER = {
  CLASSIC: 0,
  SIGNATURE: 1,
  CRYSTAL: 2,
  PLATINUM: 3,
} as const;

function buildMemberships(
  membershipPrices: ServicesMembershipPrices,
): MembershipTier[] {
  const signatureOfferIsActive = isSignatureOfferValid();
  const signatureCurrentPrice = signatureOfferIsActive
    ? membershipPrices.SIGNATURE.price
    : (membershipPrices.SIGNATURE.originalPrice ??
      membershipPrices.SIGNATURE.price);
  const signatureOriginalPrice = signatureOfferIsActive
    ? membershipPrices.SIGNATURE.originalPrice
    : null;

  return [
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
}

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

export default function ServicesClient({
  membershipPrices,
  oneTimeConsultation,
}: {
  membershipPrices: ServicesMembershipPrices;
  oneTimeConsultation: OneTimeConsultationPricing;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const memberships = useMemo(
    () => buildMemberships(membershipPrices),
    [membershipPrices],
  );
  const membershipAmounts = useMemo<Record<ClientMembership["tier"], number>>(
    () => ({
      CLASSIC: membershipPrices.CLASSIC.price,
      SIGNATURE: membershipPrices.SIGNATURE.price,
      CRYSTAL: membershipPrices.CRYSTAL.price,
      PLATINUM: membershipPrices.PLATINUM.price,
    }),
    [membershipPrices],
  );
  const [selectedMembership, setSelectedMembership] = useState<MembershipTier | null>(
    null,
  );
  const [clientMembership, setClientMembership] = useState<ClientMembership | null>(
    null,
  );
  const [isMembershipLoading, setIsMembershipLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    trackViewMembership("CLASSIC", membershipPrices.CLASSIC.price);
    const signaturePrice = isSignatureOfferValid()
      ? membershipPrices.SIGNATURE.price
      : (membershipPrices.SIGNATURE.originalPrice ??
        membershipPrices.SIGNATURE.price);

    trackViewMembership("SIGNATURE", signaturePrice);
  }, [membershipPrices]);

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
          const membership = data?.membership ?? null;
          setClientMembership(membership);

          if (membership?.status === "PENDING") {
            router.replace(
              `/membership/pending?tier=${membership.tier}&amount=${membershipAmounts[membership.tier]}`,
            );
          }
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
  }, [membershipAmounts, router, session?.user]);

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
    <main className="overflow-x-hidden bg-page text-page">
      <section
        className="relative overflow-hidden px-4 py-7 sm:px-6 sm:py-8 lg:py-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(248,245,240,0.98) 0%, rgba(239,228,210,0.94) 42%, rgba(198,165,107,0.32) 100%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(255,255,255,0.75) 0%, transparent 34%), radial-gradient(circle at bottom right, rgba(198,165,107,0.22) 0%, transparent 36%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl text-center">
          <h1
            className="text-page text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Our SkinCare Programs
          </h1>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[20px] border px-4 py-8 text-center sm:rounded-[28px] sm:px-10 sm:py-16"
          style={{
            borderColor: "#EADDCD",
            backgroundImage:
              "linear-gradient(rgba(248,245,240,0.6), rgba(248,245,240,0.9)), url('/hero/consult.jpg')",
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            boxShadow: "0 18px 48px rgba(43, 43, 43, 0.7)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(198,165,107,0.12) 100%)",
            }}
          />
          <p
            className="relative mx-auto max-w-4xl text-sm leading-7 sm:text-lg sm:leading-8"
            style={{ color: "#6E6257" }}
          >
            A complete skin transformation program where individuals committed
            to achieving long-term skin improvement through regular monitoring
            and expert guidance. Basic to Advanced Skin Assessment and 1-on-1
            Consultation by our Aestheticians. Personalized Product
            Recommendation and Customized Routine with Online Support according
            to criteria.
          </p>
        </div>
      </section>

      <section className="px-4 pb-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <div
            className="h-px w-full flex-1"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #B87B68 50%, transparent 100%)",
            }}
          />
          <p
            className="max-w-xs px-1 text-center text-xs font-semibold uppercase leading-5 tracking-[0.12em] sm:max-w-none sm:px-2 sm:text-sm sm:tracking-[0.16em]"
            style={{ color: "#B87B68" }}
          >
            View our Comprehensive Membership Details and Pricing Below
          </p>
          <div
            className="h-px w-full flex-1"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #B87B68 50%, transparent 100%)",
            }}
          />
        </div>
      </section>

      <section className="px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-start">
          <div>
            <div className="grid grid-cols-1 gap-6">
              <DirectConsultationCard pricing={oneTimeConsultation} />
              <ClassicMembershipCard price={membershipPrices.CLASSIC.price} />
              {memberships.map((membership) => {
                const actionState = getMembershipActionState(membership);

                return (
                  <MembershipCard
                    key={membership.key}
                    step={{
                      title: membership.title,
                      validity: membership.validity,
                      cost: membership.cost,
                      originalCost: membership.originalCost,
                      discountBadge: membership.discountBadge,
                      priceNote: membership.priceNote,
                      statusBadge: !isMembershipAvailable(membership.tierValue)
                        ? getMembershipAvailabilityLabel(membership.tierValue)
                        : undefined,
                      description: membership.description,
                      tier: membership.key,
                    }}
                    benefits={membership.benefits.map((benefit) => benefit.heading)}
                    actionLabel={actionState.label}
                    actionHref={actionState.href ?? undefined}
                    actionDisabled={actionState.disabled}
                    onViewDetails={() => setSelectedMembership(membership)}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div
              className="w-full max-w-full rounded-[20px] border px-4 py-5 sm:max-w-sm sm:rounded-[24px] sm:px-6 sm:py-6"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(248,245,240,0.98) 100%)",
                borderColor: "#EADDCD",
              }}
            >
              <DoctorMascot />
            </div>
          </div>
        </div>
      </section>

      {selectedMembership ? (
        <MembershipModal
          membership={selectedMembership}
          actionState={getMembershipActionState(selectedMembership)}
          onClose={() => setSelectedMembership(null)}
        />
      ) : null}
    </main>
  );
}
