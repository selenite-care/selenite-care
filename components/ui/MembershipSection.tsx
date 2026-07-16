"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getMembershipAvailabilityLabel,
  isMembershipAvailable,
} from "@/lib/membershipAvailability";
import {
  getProductDiscount,
  isSignatureOfferValid,
  MEMBERSHIP_PRICES,
} from "@/lib/membershipDiscounts";
import TermsAndConditionsModal from "@/components/membership/TermsAndConditionsModal";
import ViewportAnimatedSection from "@/components/ui/ViewportAnimatedSection";
import { MembershipCard } from "@/components/ui/MembershipCards";

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
    discountBadge: signatureOfferIsActive ? "LIMITED TIME OFFER" : undefined,
    priceNote: signatureOfferIsActive
      ? "Offer valid till July 30, 2026"
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
  key: "signature" | "crystal" | "platinum";
  tierValue: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
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
  tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
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
    discountBadge: signatureOfferIsActive ? "LIMITED TIME OFFER" : undefined,
    priceNote: signatureOfferIsActive
      ? "Offer valid till July 30, 2026"
      : undefined,
    description:
      "A perfect starting point for individuals seeking professional skincare guidance and routine development.",
    accentColor: "#B87B68",
    benefits: [
      { heading: "90 Days of Unlimited Skincare Support", points: [] },
      {
        heading: "Skin, Body & Hair Problem Analysis",
        points: ["Self-submitted photo review", "Online skin assessment form"],
      },
      {
        heading: "Online and Offline Consultation with Skin Doctor / Aestheticians",
        points: [],
      },
      { heading: "Personalized Product Recommendation List", points: [] },
      { heading: "Skin Report Card", points: [] },
      {
        heading: "Personalized Morning & Night Skincare Routine",
        points: [],
      },
      { heading: "Before & After Consultation Support", points: [] },
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
          "Personalized Morning & Night Skincare Routine",
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
          "Personalized Morning & Night Skincare Routine",
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
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close membership details"
        onClick={onClose}
        className="modal-overlay absolute inset-0"
        style={{ backgroundColor: "rgba(43, 43, 43, 0.76)" }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`membership-modal-${membership.key}`}
        className="modal-card relative z-10 flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-[#EADDCD] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#242220]"
        style={{
          boxShadow: "0 32px 90px rgba(43, 43, 43, 0.28)",
        }}
      >
        <div
          className="border-b px-6 pb-5 pt-6 sm:px-8"
          style={{
            borderColor: "#EADDCD",
            background:
              membership.key === "platinum"
                ? "linear-gradient(135deg, #111111 0%, #1E1A15 100%)"
                : membership.key === "crystal"
                  ? "linear-gradient(135deg, rgba(224,244,255,0.95) 0%, rgba(200,235,255,0.92) 100%)"
                  : "linear-gradient(135deg, #FDF8F0 0%, #F2E7D6 100%)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border text-lg transition-colors hover:bg-white/60 dark:border-[#3D3530] dark:hover:bg-[#2A2724]"
            style={{
              borderColor: "#EADDCD",
              color: membership.key === "platinum" ? "#F8F5F0" : "#2B2B2B",
              backgroundColor:
                membership.key === "platinum"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.85)",
            }}
          >
            ×
          </button>

          <div
            className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{
              background:
                membership.key === "crystal"
                  ? "linear-gradient(135deg, #5BB8F5 0%, #2A8FD4 100%)"
                  : "linear-gradient(135deg, #B87B68 0%, #A8864D 100%)",
              color: membership.key === "platinum" ? "#111111" : "#FFF8EE",
            }}
          >
            {membership.key}
          </div>

          <h2
            id={`membership-modal-${membership.key}`}
            className="mt-4 text-2xl font-bold dark:text-[#F0EDE8] sm:text-3xl"
            style={{
              color: membership.key === "platinum" ? "#F8F5F0" : "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            {membership.title}
          </h2>

          <p
            className="mt-3 max-w-xl text-sm leading-6 dark:text-[#8A7D75] sm:text-base"
            style={{
              color: membership.key === "platinum" ? "#EADDCD" : "#6E6257",
            }}
          >
            {membership.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="text-3xl font-semibold"
                style={{
                  color:
                    membership.key === "platinum"
                      ? "#F3E0B5"
                      : "#B87B68",
                  fontFamily: "Playfair Display, serif",
                }}
              >
                {membership.cost}
              </span>
              {membership.originalCost ? (
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: "#8C7967",
                    textDecoration: "line-through",
                    textDecorationThickness: "1.5px",
                  }}
                >
                  {membership.originalCost}
                </span>
              ) : null}
            </div>
            <span
              className="text-xs font-semibold uppercase tracking-[0.14em]"
              style={{
                color: membership.key === "platinum" ? "#EADDCD" : "#8C7967",
              }}
            >
              {membership.validity}
            </span>
          </div>
          {membership.discountBadge ? (
            <span
              className="mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{
                backgroundColor: membership.discountBadge.includes("OFF on All Products")
                  ? "#DCFCE7"
                  : "#FEE2E2",
                color: membership.discountBadge.includes("OFF on All Products")
                  ? "#15803D"
                  : "#B91C1C",
              }}
            >
              {membership.discountBadge}
            </span>
          ) : null}
          {membership.priceNote ? (
            <p
              className="mt-3 text-xs leading-6 dark:text-[#8A7D75]"
              style={{ color: "#8C7967" }}
            >
              {membership.priceNote}
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="space-y-5 pb-2">
            {membership.benefits.map((benefit, index) => (
              <div key={`${membership.key}-${benefit.heading}`}>
                <div className="flex gap-3">
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    style={{
                      background: "linear-gradient(135deg, #B87B68 0%, #A8864D 100%)",
                      color: "#FFF8EE",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold leading-6 text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-base"
                    >
                      {benefit.heading}
                    </p>
                    {benefit.points.length > 0 ? (
                      <ul className="mt-2 space-y-1.5">
                        {benefit.points.map((point) => (
                          <li
                            key={point}
                            className="flex gap-2 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]"
                          >
                            <span className="text-[#B87B68] dark:text-[#D4B47A]">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="shrink-0 border-t border-[#EADDCD] bg-[#F8F5F0] px-6 py-5 dark:border-[#3D3530] dark:bg-[#242220] sm:px-8"
          style={{
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-lg">
              <label className="flex items-start gap-3 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]">
                <input
                  type="checkbox"
                  checked={hasAcceptedTerms}
                  onChange={(event) => setHasAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border border-[#EADDCD] dark:border-[#3D3530]"
                  style={{ accentColor: "#B87B68" }}
                />
                <span>
                  <span style={{ color: "#C84B4B" }}>*</span>{" "}
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setIsTermsOpen(true)}
                    className="font-semibold text-[#2B2B2B] underline underline-offset-2 dark:text-[#F0EDE8]"
                  >
                    Terms & Conditions
                  </button>
                </span>
              </label>
            </div>

            {actionState.disabled || !actionState.href || !hasAcceptedTerms ? (
              <button
                type="button"
                disabled
                className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-[#CFC5BA] px-5 text-sm font-medium text-[#6E6257] opacity-60 dark:bg-[#3D3530] dark:text-[#8A7D75] sm:w-auto"
                style={{
                }}
              >
                {actionState.label}
              </button>
            ) : (
              <Link
                href={actionState.href}
                className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A] sm:w-auto"
                style={{
                }}
              >
                {actionState.label}
              </Link>
            )}
          </div>
        </div>
      </div>

      {isTermsOpen ? (
        <TermsAndConditionsModal onClose={() => setIsTermsOpen(false)} />
      ) : null}
    </div>
  );
}

export default function MembershipSection() {
  const { data: session } = useSession();
  const [selectedMembership, setSelectedMembership] = useState<MembershipTier | null>(
    null,
  );
  const [clientMembership, setClientMembership] = useState<ClientMembership | null>(
    null,
  );
  const [isMembershipLoading, setIsMembershipLoading] = useState(false);

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
        label: "Get this Membership",
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
      new Date(clientMembership.expiresAt).getTime() > Date.now();

    if (!hasActiveMembership || !clientMembership) {
      return {
        disabled: false,
        href: `/membership/payment?tier=${membership.tierValue}`,
        label: "Get this Membership",
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
              Our Memberships
            </h2>
            <p className="text-muted mt-4 text-base leading-7 text-[#884F38] dark:text-[#8A7D75]">
              We have 3 membership plan categories. You can choose your own membership.
            </p>
          </div>

          <ViewportAnimatedSection className="step-card-trigger mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const membership = memberships[index];

              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setSelectedMembership(membership)}
                  className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                  style={{ borderRadius: 20 }}
                >
                  <MembershipCard
                    step={{
                      ...step,
                      statusBadge: !isMembershipAvailable(membership.tierValue)
                        ? getMembershipAvailabilityLabel(membership.tierValue)
                        : undefined,
                    }}
                    index={index}
                    footerText="View details ->"
                  />
                </button>
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
