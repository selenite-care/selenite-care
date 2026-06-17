"use client";

import { useEffect, useState } from "react";

type TotalQuota = {
  type: "total";
  limit: number;
  used: number;
  remaining: number;
  isUnlimited: false;
};

type SpecializationQuotaValue = {
  limit: number | null;
  used: number;
  remaining: number | null;
  isUnlimited: boolean;
};

type SpecializationQuota = {
  type: "specialization";
  AESTHETICIAN: SpecializationQuotaValue;
  NUTRITIONIST: SpecializationQuotaValue;
  PSYCHIATRIST: SpecializationQuotaValue;
};

type MembershipQuotaResponse = {
  membership: {
    id: string;
    tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
    status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
    expiresAt: string | null;
  };
  quota: TotalQuota | SpecializationQuota;
} | null;

const specializationLabels = {
  AESTHETICIAN: "Aesthetician",
  NUTRITIONIST: "Nutritionist",
  PSYCHIATRIST: "Psychiatrist",
} as const;

const specializationKeys = [
  "AESTHETICIAN",
  "NUTRITIONIST",
  "PSYCHIATRIST",
] as const;

function formatQuotaValue(value: number | null) {
  return value === null ? "Unlimited" : String(value);
}

export default function ClientQuotaSummaryCard() {
  const [quotaData, setQuotaData] = useState<MembershipQuotaResponse>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadQuota() {
      try {
        const response = await fetch("/api/client/membership-quota");
        const data = (await response.json().catch(() => null)) as
          | MembershipQuotaResponse
          | { error?: string }
          | null;

        if (!response.ok) {
          throw new Error(
            data && "error" in data ? data.error ?? "Unable to load quota." : "Unable to load quota.",
          );
        }

        if (isMounted) {
          setQuotaData((data as MembershipQuotaResponse) ?? null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load quota summary.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadQuota();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
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
        <p className="text-sm" style={{ color: "#B8A89A" }}>
          Loading quota summary...
        </p>
      </article>
    );
  }

  if (error || !quotaData) {
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
        <h2
          className="text-2xl font-semibold"
          style={{
            color: "#2B2B2B",
            fontFamily: "Playfair Display, serif",
          }}
        >
          Membership Quota Summary
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: "#6E6257" }}>
          {error || "Quota information is not available right now."}
        </p>
      </article>
    );
  }

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "#B8A89A" }}>
            Membership Quota Summary
          </p>
          <p className="mt-3 text-lg font-semibold" style={{ color: "#2B2B2B" }}>
            Consultation usage for your current membership
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: "#6E6257" }}>
            This is the same quota view used during appointment booking.
          </p>
        </div>

        <span
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
          style={{
            backgroundColor: "rgba(198, 165, 107, 0.14)",
            color: "#8A6A2F",
          }}
        >
          {quotaData.membership.tier}
        </span>
      </div>

      {quotaData.quota.type === "total" ? (
        <div
          className="mt-5 rounded-2xl border px-5 py-4"
          style={{
            borderColor: "#D8C7B5",
            backgroundColor: "#F8F5F0",
          }}
        >
          <p className="text-base font-medium" style={{ color: "#2B2B2B" }}>
            {quotaData.quota.used} of {quotaData.quota.limit} consultations used
          </p>
          <p className="mt-2 text-sm" style={{ color: "#6E6257" }}>
            {quotaData.quota.remaining} consultation
            {quotaData.quota.remaining === 1 ? "" : "s"} remaining
          </p>
        </div>
      ) : quotaData.quota.type === "specialization" ? (
  <div className="mt-5 grid gap-4 md:grid-cols-3">
    {specializationKeys.map((key) => {
      const quota = (quotaData.quota as SpecializationQuota)[key];
      const label = specializationLabels[key];

      return (
              <div
                key={key}
                className="rounded-2xl border px-5 py-4"
                style={{
                  borderColor: "#D8C7B5",
                  backgroundColor: "#F8F5F0",
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                  {label}
                </p>
                <p className="mt-2 text-base font-medium" style={{ color: "#6E6257" }}>
                  {quota.used}/{formatQuotaValue(quota.limit)} used
                </p>
                <p className="mt-1 text-sm" style={{ color: "#8C7967" }}>
                  {quota.isUnlimited
                    ? "Unlimited remaining"
                    : `${quota.remaining ?? 0} remaining`}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
