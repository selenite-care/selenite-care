"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

type MembershipTier = "SIGNATURE" | "CRYSTAL" | "PLATINUM";

function formatTierLabel(tier: MembershipTier | null) {
  switch (tier) {
    case "SIGNATURE":
      return "Signature Membership";
    case "CRYSTAL":
      return "Crystal Membership";
    case "PLATINUM":
      return "Platinum Membership";
    default:
      return "Membership";
  }
}

function PendingMembershipContent() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("tier");
  const amountParam = searchParams.get("amount");

  const tier = useMemo(() => {
    if (
      tierParam === "SIGNATURE" ||
      tierParam === "CRYSTAL" ||
      tierParam === "PLATINUM"
    ) {
      return tierParam;
    }

    return null;
  }, [tierParam]);

  const amount = useMemo(() => {
    const parsed = Number(amountParam);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [amountParam]);

  return (
    <main className="flex min-h-screen items-center bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-3xl">
        <section
          className="rounded-[28px] border px-6 py-12 text-center shadow-sm dark:border-[#3D3530] dark:bg-[#242220] sm:px-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,245,240,1) 100%)",
            borderColor: "#EADDCD",
            boxShadow: "0 24px 60px rgba(43, 43, 43, 0.08)",
          }}
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#B87B68] bg-[rgba(198,165,107,0.12)] dark:bg-[rgba(198,165,107,0.14)]">
            <Clock3 className="h-10 w-10 text-[#B87B68]" />
          </div>

          <h1
            className="mt-8 text-4xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Payment Under Review
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#6E6257] dark:text-[#8A7D75] sm:text-lg">
            Your payment submission has been received. Our team will verify and
            activate your membership within a few hours during business hours.
            Please do not submit again - we have your information.
          </p>

          {tier || amount ? (
            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#B87B68] bg-[rgba(198,165,107,0.08)] px-5 py-5 dark:bg-[rgba(198,165,107,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7967] dark:text-[#8A7D75]">
                Submitted Membership
              </p>

              {tier ? (
                <p
                  className="mt-3 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {formatTierLabel(tier)}
                </p>
              ) : null}

              {amount ? (
                <p className="mt-2 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                  Amount: {Math.round(amount)} BDT
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-10 flex justify-center">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#2B2B2B] px-6 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function PendingMembershipFallback() {
  return (
    <main className="flex min-h-screen items-center bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm text-[#884F38] dark:text-[#8A7D75]">Loading...</p>
      </div>
    </main>
  );
}

export default function PendingMembershipPage() {
  return (
    <Suspense fallback={<PendingMembershipFallback />}>
      <PendingMembershipContent />
    </Suspense>
  );
}
