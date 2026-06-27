"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatDateOnly } from "@/lib/dateUtils";

type MembershipResponse = {
  membership?: {
    membershipId: string;
    tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
    status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
    createdAt: string;
    expiresAt: string | null;
  } | null;
  error?: string;
};

function getTierBadgeStyles(tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM") {
  switch (tier) {
    case "PLATINUM":
      return {
        backgroundColor: "#2B2B2B",
        color: "#F8F5F0",
      };
    case "CRYSTAL":
      return {
        backgroundColor: "rgba(75, 157, 211, 0.14)",
        color: "#1D5F89",
      };
    case "SIGNATURE":
    default:
      return {
        backgroundColor: "rgba(198, 165, 107, 0.14)",
        color: "#8A6A2F",
      };
  }
}

function getTierSummary(tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM") {
  switch (tier) {
    case "CRYSTAL":
      return "1 Year Specialist Support with advanced skin assessment and customized care plan.";
    case "PLATINUM":
      return "3 Years of Premium Specialist Support including skin transformation program and progress monitoring.";
    case "SIGNATURE":
    default:
      return "60 Days of Unlimited Skincare Support with personalized consultation and routine development.";
  }
}

function MembershipWelcomePageContent() {
  const searchParams = useSearchParams();
  const membershipId = searchParams.get("id") ?? "";
  const [membership, setMembership] = useState<MembershipResponse["membership"]>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMembership() {
      try {
        const response = await fetch("/api/client/membership");
        const data = (await response.json().catch(() => null)) as
          | MembershipResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load membership.");
        }

        if (isMounted) {
          setMembership(data?.membership ?? null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load membership details.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMembership();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayMembershipId = membership?.membershipId ?? membershipId;
  const activationDate = membership?.createdAt
    ? formatDateOnly(membership.createdAt)
    : "Loading...";
  const expiryDate = membership?.expiresAt
    ? formatDateOnly(membership.expiresAt)
    : "N/A";

  return (
    <main className="flex min-h-screen items-center bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-3xl">
        <section
          className="rounded-[28px] border bg-white px-6 py-12 text-center shadow-sm dark:bg-[#242220] dark:border-[#3D3530] sm:px-10"
          style={{
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
            className="text-4xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Welcome to Selenite Care
          </h1>

          <div
            className="mx-auto mt-8 max-w-md rounded-2xl border px-5 py-4 dark:border-[#3D3530]"
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
              className="mt-2 text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-2xl"
              style={{
                fontFamily: "Playfair Display, serif",
              }}
            >
              {displayMembershipId || "Pending Assignment"}
            </p>
          </div>

          {isLoading ? (
            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-[#6E6257] dark:text-[#8A7D75] sm:text-lg">
              Loading membership details...
            </p>
          ) : error ? (
            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-red-600">
              {error}
            </p>
          ) : membership ? (
            <>
              <p
                className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75] sm:text-base"
              >
                {getTierSummary(membership.tier)}
              </p>

              <div className="mt-6 flex justify-center">
                <span
                  className="inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
                  style={getTierBadgeStyles(membership.tier)}
                >
                  {membership.tier}
                </span>
              </div>

              <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
                <div
                  className="rounded-2xl border bg-white px-5 py-4 text-left dark:bg-[#242220] dark:border-[#3D3530]"
                  style={{
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "#8C7967" }}
                  >
                    Activation Date
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                    {activationDate}
                  </p>
                </div>
                <div
                  className="rounded-2xl border bg-white px-5 py-4 text-left dark:bg-[#242220] dark:border-[#3D3530]"
                  style={{
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "#8C7967" }}
                  >
                    Expiry Date
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                    {expiryDate}
                  </p>
                </div>
              </div>

              <p
                className="mx-auto mt-8 max-w-2xl text-base leading-8 text-[#6E6257] dark:text-[#8A7D75] sm:text-lg"
              >
                Your membership is now active! You can now book appointments with
                our doctors.
              </p>
            </>
          ) : (
            <p
              className="mx-auto mt-8 max-w-2xl text-base leading-8 text-[#6E6257] dark:text-[#8A7D75] sm:text-lg"
            >
              Your membership details are not available right now.
            </p>
          )}

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/appointment"
              className="inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors hover:bg-[#B8A89A]"
              style={{
                backgroundColor: "#2B2B2B",
                color: "#F8F5F0",
                border: "1px solid #D8C7B5",
              }}
            >
              Book Appointment
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-md border border-[#D8C7B5] bg-[#F8F5F0] px-6 text-sm font-medium text-[#2B2B2B] transition-colors dark:bg-[#242220] dark:border-[#3D3530] dark:text-[#F0EDE8]"
              style={{
              }}
            >
              Go to Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function MembershipWelcomeLoadingFallback() {
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

export default function MembershipWelcomePage() {
  return (
    <Suspense fallback={<MembershipWelcomeLoadingFallback />}>
      <MembershipWelcomePageContent />
    </Suspense>
  );
}
