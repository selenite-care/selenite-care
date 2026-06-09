"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

type MembershipTier = "SIGNATURE" | "CRYSTAL" | "PLATINUM";

type MembershipTierDetails = {
  name: string;
  price: number;
  benefits: string[];
};

type CreateIntentResponse = {
  clientSecret?: string;
  amount?: number;
  error?: string;
};

type CreateMembershipResponse = {
  membershipId?: string;
  error?: string;
};

const MEMBERSHIPS: Record<MembershipTier, MembershipTierDetails> = {
  SIGNATURE: {
    name: "Signature Membership",
    price: 490,
    benefits: [
      "100% off on the 2nd consultation",
      "120 days of online support",
      "Digital skin analysis and personalized skincare routine",
    ],
  },
  CRYSTAL: {
    name: "Crystal Membership",
    price: 2900,
    benefits: [
      "5 complimentary follow-up consultations",
      "Specialist access with aesthetician, nutritionist, and psychiatrist support",
      "Advanced skin assessment with a customized care plan",
    ],
  },
  PLATINUM: {
    name: "Platinum Membership",
    price: 6900,
    benefits: [
      "30 complimentary follow-up consultations",
      "Extended specialist access and long-term online support",
      "Skin transformation roadmap with progress monitoring",
    ],
  },
};

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

function parseTier(value: string | null): MembershipTier | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (
    normalized === "SIGNATURE" ||
    normalized === "CRYSTAL" ||
    normalized === "PLATINUM"
  ) {
    return normalized;
  }

  return null;
}

function MembershipPaymentForm({
  tier,
  membership,
}: {
  tier: MembershipTier;
  membership: MembershipTierDetails;
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!stripe || !elements) {
      setError("Payment form is still loading.");
      setIsSubmitting(false);
      return;
    }

    const card = elements.getElement(CardElement);

    if (!card) {
      setError("Card details are required.");
      setIsSubmitting(false);
      return;
    }

    const intentResponse = await fetch("/api/membership/create-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tier }),
    });

    const intentData = (await intentResponse.json()) as CreateIntentResponse;

    if (!intentResponse.ok || !intentData.clientSecret) {
      setError(intentData.error ?? "Unable to start payment.");
      setIsSubmitting(false);
      return;
    }

    const { error: paymentError, paymentIntent } =
      await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card,
        },
      });

    if (paymentError || paymentIntent?.status !== "succeeded") {
      setError(paymentError?.message ?? "Payment was not completed.");
      setIsSubmitting(false);
      return;
    }

    const membershipResponse = await fetch("/api/membership/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tier,
        stripePaymentId: paymentIntent.id,
      }),
    });

    const membershipData =
      (await membershipResponse.json().catch(() => null)) as
        | CreateMembershipResponse
        | null;

    if (!membershipResponse.ok || !membershipData?.membershipId) {
      setError(
        membershipData?.error ??
          "Payment succeeded, but membership creation failed.",
      );
      setIsSubmitting(false);
      return;
    }

    router.push(
      `/membership/welcome?id=${encodeURIComponent(membershipData.membershipId)}`,
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-white p-6"
      style={{ borderColor: "#D8C7B5" }}
    >
      <h2
        className="text-xl font-semibold"
        style={{
          color: "#2B2B2B",
          fontFamily: "Playfair Display, serif",
        }}
      >
        Card Payment
      </h2>

      <div
        className="mt-5 rounded-xl border-2 p-4"
        style={{ borderColor: "#D8C7B5" }}
      >
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: "#2B2B2B",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "16px",
                "::placeholder": {
                  color: "#B8A89A",
                },
              },
            },
          }}
        />
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors"
        style={{
          backgroundColor: !stripe || isSubmitting ? "#D8C7B5" : "#2B2B2B",
          color: "#F8F5F0",
          cursor: !stripe || isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? "Processing..." : `Pay ${formatBdt(membership.price)}`}
      </button>
    </form>
  );
}

function MembershipPaymentPageContent() {
  const searchParams = useSearchParams();
  const tier = useMemo(
    () => parseTier(searchParams.get("tier")),
    [searchParams],
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bkash">("card");

  if (!tier) {
    return (
      <section
        className="flex min-h-screen flex-1 bg-[#F8F5F0] px-6 py-16"
      >
        <div className="mx-auto w-full max-w-5xl">
          <h1
            className="text-3xl font-bold sm:text-4xl"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Membership Payment
          </h1>
          <p className="mt-4 text-sm" style={{ color: "#B8A89A" }}>
            A valid membership tier is required to continue.
          </p>
        </div>
      </section>
    );
  }

  const membership = MEMBERSHIPS[tier];

  return (
    <section className="flex flex-1 bg-[#F8F5F0] px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Membership Payment
          </h1>
          <p className="mt-4 text-base leading-7" style={{ color: "#B8A89A" }}>
            Complete your payment to secure your Selenite Care membership.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="order-2 flex flex-col gap-6 lg:order-1">
            <div
              className="flex flex-wrap gap-2 rounded-2xl border bg-white p-1"
              style={{ borderColor: "#D8C7B5" }}
            >
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className="h-11 rounded-xl px-5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    paymentMethod === "card" ? "#2B2B2B" : "transparent",
                  color: paymentMethod === "card" ? "#F8F5F0" : "#B8A89A",
                }}
              >
                Pay with Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("bkash")}
                className="h-11 rounded-xl px-5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    paymentMethod === "bkash" ? "#2B2B2B" : "transparent",
                  color: paymentMethod === "bkash" ? "#F8F5F0" : "#B8A89A",
                }}
              >
                bKash
              </button>
            </div>

            {paymentMethod === "card" ? (
              <MembershipPaymentForm tier={tier} membership={membership} />
            ) : (
              <section
                className="rounded-2xl border bg-white p-6"
                style={{ borderColor: "#D8C7B5" }}
              >
                <h2
                  className="text-xl font-semibold"
                  style={{
                    color: "#2B2B2B",
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  bKash
                </h2>
                <p className="mt-4 text-sm leading-6" style={{ color: "#B8A89A" }}>
                  bKash payment is coming soon. Please use card payment for now.
                </p>
              </section>
            )}
          </div>

          <aside
            className="order-1 h-fit rounded-2xl border bg-white p-6 lg:order-2"
            style={{ borderColor: "#D8C7B5" }}
          >
            <h2
              className="text-xl font-semibold"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Order Summary
            </h2>

            <div className="mt-5">
              <p className="text-base font-semibold" style={{ color: "#2B2B2B" }}>
                {membership.name}
              </p>
              <p
                className="mt-3 text-2xl font-semibold"
                style={{
                  color: "#C6A56B",
                  fontFamily: "Playfair Display, serif",
                }}
              >
                {formatBdt(membership.price)}
              </p>
            </div>

            <div className="mt-6 border-t pt-5" style={{ borderColor: "#D8C7B5" }}>
              <p
                className="text-sm font-semibold uppercase tracking-[0.12em]"
                style={{ color: "#8C7967" }}
              >
                Benefits
              </p>
              <ul className="mt-4 space-y-3">
                {membership.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex gap-2 text-sm leading-6"
                    style={{ color: "#6E6257" }}
                  >
                    <span style={{ color: "#C6A56B" }}>•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function MembershipPaymentLoadingFallback() {
  return (
    <section className="flex min-h-screen flex-1 bg-[#F8F5F0] px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-sm" style={{ color: "#B8A89A" }}>
          Loading...
        </p>
      </div>
    </section>
  );
}

export default function MembershipPaymentPage() {
  if (!stripePublishableKey || !stripePromise) {
    return (
      <section className="flex min-h-screen flex-1 bg-[#F8F5F0] px-6 py-16">
        <div className="mx-auto w-full max-w-6xl">
          <h1
            className="text-3xl font-bold sm:text-4xl"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Payment Unavailable
          </h1>
          <p className="mt-4 text-sm" style={{ color: "#B8A89A" }}>
            Stripe publishable key is not configured.
          </p>
        </div>
      </section>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <Suspense fallback={<MembershipPaymentLoadingFallback />}>
        <MembershipPaymentPageContent />
      </Suspense>
    </Elements>
  );
}
