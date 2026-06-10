"use client";

import { useEffect, useState } from "react";

type CrmMembership = {
  id: string;
  membershipId: string;
  tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  createdAt: string;
  expiresAt: string | null;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
  };
};

type MembershipResponse = {
  memberships?: CrmMembership[];
  error?: string;
};

function getTierBadgeStyles(tier: CrmMembership["tier"]) {
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

function getStatusBadgeStyles(status: CrmMembership["status"]) {
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

function getDaysRemaining(expiresAt: string | null) {
  if (!expiresAt) {
    return null;
  }

  return Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

export default function CrmMembershipsPage() {
  const [memberships, setMemberships] = useState<CrmMembership[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMemberships() {
      try {
        const response = await fetch("/api/crm/memberships");
        const data = (await response.json()) as MembershipResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load memberships.");
        }

        setMemberships(data.memberships ?? []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Memberships are not available right now.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadMemberships();
  }, []);

  return (
    <section className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 rounded-3xl border border-black/10 bg-background p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-3xl font-semibold text-foreground">Memberships</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Review membership records, client details, and current activation status.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-foreground/70">Loading memberships...</p>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!isLoading && !error && memberships.length === 0 ? (
          <p className="text-sm text-foreground/70">No memberships found.</p>
        ) : null}

        {!isLoading && !error && memberships.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 font-medium">Membership ID</th>
                    <th className="px-4 py-3 font-medium">Client Name</th>
                    <th className="px-4 py-3 font-medium">Client Phone</th>
                    <th className="px-4 py-3 font-medium">Tier</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Days Remaining</th>
                    <th className="px-4 py-3 font-medium">Purchase Date</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.map((membership) => {
                    const daysRemaining = getDaysRemaining(membership.expiresAt);

                    return (
                      <tr
                        key={membership.id}
                        className="border-b border-black/10 last:border-0 dark:border-white/10"
                      >
                        <td className="px-4 py-4 font-mono text-xs text-foreground/70">
                          {membership.membershipId}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {membership.user.name ?? membership.user.email}
                        </td>
                        <td className="px-4 py-4 text-foreground/70">
                          {membership.user.phone ?? "-"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                            style={getTierBadgeStyles(membership.tier)}
                          >
                            {membership.tier}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                            style={getStatusBadgeStyles(membership.status)}
                          >
                            {membership.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {membership.status === "PENDING" ? (
                            <span className="text-sm font-medium text-foreground/70">
                              Pending
                            </span>
                          ) : daysRemaining === null ? (
                            <span className="text-sm font-medium text-foreground/70">
                              -
                            </span>
                          ) : daysRemaining <= 0 ? (
                            <span className="text-sm font-medium text-red-600">
                              Expired
                            </span>
                          ) : (
                            <span
                              className={
                                daysRemaining > 30
                                  ? "text-sm font-medium text-emerald-600"
                                  : "text-sm font-medium text-yellow-600"
                              }
                            >
                              {daysRemaining} day{daysRemaining === 1 ? "" : "s"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-foreground/70">
                          {new Date(membership.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="px-4 pb-4 text-xs text-foreground/60 md:hidden">
              Scroll to see more
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
