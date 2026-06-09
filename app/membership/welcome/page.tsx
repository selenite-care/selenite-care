"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function MembershipWelcomePageContent() {
  const searchParams = useSearchParams();
  const membershipId = searchParams.get("id") ?? "";

  return (
    <main
      className="flex min-h-screen items-center px-6 py-16"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <section
          className="rounded-[28px] border px-6 py-12 text-center shadow-sm sm:px-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,245,240,1) 100%)",
            borderColor: "#D8C7B5",
            boxShadow: "0 24px 60px rgba(43, 43, 43, 0.08)",
          }}
        >
          <div
            className="mx-auto mb-6 h-1 w-24 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C6A56B 50%, transparent 100%)",
            }}
          />

          <h1
            className="text-4xl font-bold sm:text-5xl"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Welcome to Selenite Care
          </h1>

          <div
            className="mx-auto mt-8 max-w-md rounded-2xl border px-5 py-4"
            style={{
              borderColor: "#C6A56B",
              backgroundColor: "rgba(198, 165, 107, 0.08)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: "#8C7967" }}
            >
              Membership ID
            </p>
            <p
              className="mt-2 text-xl font-semibold sm:text-2xl"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              {membershipId || "Pending Assignment"}
            </p>
          </div>

          <p
            className="mx-auto mt-8 max-w-2xl text-base leading-8 sm:text-lg"
            style={{ color: "#6E6257" }}
          >
            Your membership is being verified. Our team will contact you shortly
            to activate your membership and guide you through next steps.
          </p>

          <Link
            href="/dashboard"
            className="mt-10 inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors hover:bg-[#B8A89A]"
            style={{
              backgroundColor: "#2B2B2B",
              color: "#F8F5F0",
              border: "1px solid #D8C7B5",
            }}
          >
            Go to Dashboard
          </Link>
        </section>
      </div>
    </main>
  );
}

function MembershipWelcomeLoadingFallback() {
  return (
    <main
      className="flex min-h-screen items-center px-6 py-16"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm" style={{ color: "#B8A89A" }}>
          Loading...
        </p>
      </div>
    </main>
  );
}

export default function MembershipWelcomePage() {
  return (
    <Suspense fallback={<MembershipWelcomeLoadingFallback />}>
      <MembershipWelcomePageContent />
    </Suspense>
  );
}
