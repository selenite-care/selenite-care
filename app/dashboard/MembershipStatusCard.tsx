"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Membership = {
  membershipId: string;
  tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
};

type MembershipResponse = {
  membership: Membership | null;
  error?: string;
};

function getStatusStyles(status: Membership["status"]) {
  switch (status) {
    case "ACTIVE":
      return {
        backgroundColor: "rgba(34, 197, 94, 0.12)",
        color: "#166534",
      };
    case "PENDING":
      return {
        backgroundColor: "rgba(198, 165, 107, 0.14)",
        color: "#8A6A2F",
      };
    case "EXPIRED":
      return {
        backgroundColor: "rgba(107, 114, 128, 0.16)",
        color: "#4B5563",
      };
    case "CANCELLED":
      return {
        backgroundColor: "rgba(239, 68, 68, 0.12)",
        color: "#B91C1C",
      };
  }
}

function getTierStyles(tier: Membership["tier"]) {
  switch (tier) {
    case "PLATINUM":
      return {
        backgroundColor: "#2B2B2B",
        color: "#F3E0B5",
      };
    case "CRYSTAL":
      return {
        backgroundColor: "rgba(75, 157, 211, 0.14)",
        color: "#1D5F89",
      };
    case "SIGNATURE":
      return {
        backgroundColor: "rgba(198, 165, 107, 0.14)",
        color: "#8A6A2F",
      };
  }
}

export default function MembershipStatusCard() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMembership() {
      try {
        const response = await fetch("/api/client/membership");
        const data = (await response.json()) as MembershipResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load membership.");
        }

        if (isMounted) {
          setMembership(data.membership ?? null);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load membership.",
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

  return (
    <article
      className="rounded-lg border p-6"
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "#D8C7B5",
        borderLeftColor: "#C6A56B",
        borderLeftWidth: "4px",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "#B8A89A" }}>
            Membership Status
          </p>

          {isLoading ? (
            <p className="mt-4 text-sm" style={{ color: "#B8A89A" }}>
              Loading membership...
            </p>
          ) : error ? (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          ) : membership ? (
            <>
              <p
                className="mt-4 text-2xl font-semibold tracking-tight"
                style={{ color: "#2B2B2B" }}
              >
                {membership.membershipId}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                  style={getTierStyles(membership.tier)}
                >
                  {membership.tier}
                </span>
                <span
                  className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                  style={getStatusStyles(membership.status)}
                >
                  {membership.status}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm leading-6" style={{ color: "#B8A89A" }}>
              You do not have a membership yet.
            </p>
          )}
        </div>

        {!isLoading && !membership ? (
          <Link
            href="/services"
            className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
          >
            Get Membership
          </Link>
        ) : null}
      </div>
    </article>
  );
}
