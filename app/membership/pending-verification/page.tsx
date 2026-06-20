"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PendingVerificationContent() {
  const searchParams = useSearchParams();
  const membershipId = searchParams.get("id") ?? "";

  return (
    <main className="flex min-h-screen items-center bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
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
            Payment Submitted
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-base leading-8 sm:text-lg"
            style={{ color: "#6E6257" }}
          >
            Your payment is being verified. This usually takes a few hours during
            office hours. You will receive an email once your membership is
            activated.
          </p>

          {membershipId ? (
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
                {membershipId}
              </p>
            </div>
          ) : null}

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-md border border-[#D8C7B5] bg-[#2B2B2B] px-6 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#B8A89A] dark:border-[#3D3530]"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/services"
              className="inline-flex h-12 items-center justify-center rounded-md border border-[#D8C7B5] bg-[#F8F5F0] px-6 text-sm font-medium text-[#2B2B2B] transition-colors dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8]"
            >
              Back to Memberships
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function PendingVerificationFallback() {
  return (
    <main className="flex min-h-screen items-center bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm text-[#B8A89A] dark:text-[#8A7D75]">
          Loading...
        </p>
      </div>
    </main>
  );
}

export default function PendingVerificationPage() {
  return (
    <Suspense fallback={<PendingVerificationFallback />}>
      <PendingVerificationContent />
    </Suspense>
  );
}
