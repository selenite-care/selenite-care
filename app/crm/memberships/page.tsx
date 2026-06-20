"use client";

import Papa from "papaparse";
import { Fragment, useEffect, useMemo, useState } from "react";

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
};

const membershipStatuses = [
  "All",
  "PENDING",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
] as const;

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

function formatQuotaValue(value: number | null) {
  return value === null ? "Unlimited" : String(value);
}

export default function CrmMembershipsPage() {
  const [memberships, setMemberships] = useState<CrmMembership[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof membershipStatuses)[number]>("All");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuotaId, setExpandedQuotaId] = useState<string | null>(null);
  const [quotaByMembershipId, setQuotaByMembershipId] = useState<
    Record<string, MembershipQuotaResponse>
  >({});
  const [quotaLoadingId, setQuotaLoadingId] = useState<string | null>(null);

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

  async function toggleQuotaView(membershipId: string) {
    if (expandedQuotaId === membershipId) {
      setExpandedQuotaId(null);
      return;
    }

    setExpandedQuotaId(membershipId);

    if (quotaByMembershipId[membershipId]) {
      return;
    }

    setQuotaLoadingId(membershipId);

    try {
      const response = await fetch(`/api/crm/memberships/${membershipId}/quota`);
      const data = (await response.json().catch(() => null)) as
        | MembershipQuotaResponse
        | { error?: string }
        | null;

      if (!response.ok || !data || !("quota" in data)) {
        throw new Error(
          data && "error" in data ? data.error ?? "Unable to load quota." : "Unable to load quota.",
        );
      }

      setQuotaByMembershipId((current) => ({
        ...current,
        [membershipId]: data,
      }));
    } catch (quotaError) {
      setError(
        quotaError instanceof Error
          ? quotaError.message
          : "Unable to load membership quota.",
      );
    } finally {
      setQuotaLoadingId(null);
    }
  }

  const filteredMemberships = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return memberships.filter((membership) => {
      const clientName = membership.user.name ?? membership.user.email;
      const matchesSearch =
        !normalizedQuery ||
        membership.membershipId.toLowerCase().includes(normalizedQuery) ||
        clientName.toLowerCase().includes(normalizedQuery) ||
        membership.user.email.toLowerCase().includes(normalizedQuery) ||
        (membership.user.phone ?? "").toLowerCase().includes(normalizedQuery) ||
        membership.tier.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "All" || membership.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [memberships, searchQuery, statusFilter]);

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredMemberships.map((membership) => {
        const daysRemaining = getDaysRemaining(membership.expiresAt);

        return {
          "Membership ID": membership.membershipId,
          "Client Name": membership.user.name ?? membership.user.email,
          "Client Email": membership.user.email,
          "Client Phone": membership.user.phone ?? "",
          Tier: membership.tier,
          Status: membership.status,
          "Days Remaining":
            membership.status === "PENDING"
              ? "Pending"
              : daysRemaining === null
                ? "-"
                : daysRemaining <= 0
                  ? "Expired"
                  : String(daysRemaining),
          "Purchase Date": new Date(membership.createdAt).toLocaleString(),
        };
      }),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "selenite-care-memberships.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-7xl">
        <div
          className="mb-8 rounded-3xl border bg-white p-8 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]"
          style={{ borderColor: "#D8C7B5" }}
        >
          <h1
            className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Memberships
          </h1>
          <p className="mt-2 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
            Review membership records, client details, and current activation status.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-[#B8A89A] dark:text-[#8A7D75]">
            Loading memberships...
          </p>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!isLoading && !error && memberships.length === 0 ? (
          <p className="text-sm text-[#B8A89A] dark:text-[#8A7D75]">
            No memberships found.
          </p>
        ) : null}

        {!isLoading && !error && memberships.length > 0 ? (
          <>
            <div className="mb-6 rounded-3xl border border-[#D8C7B5] bg-white p-5 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
              <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
                <div>
                  <label
                    htmlFor="crm-membership-search"
                    className="text-sm font-medium text-[#2B2B2B]"
                  >
                    Search memberships
                  </label>
                  <input
                    id="crm-membership-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Membership ID, client name, email, phone, or tier"
                    className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="crm-membership-status-filter"
                    className="text-sm font-medium text-[#2B2B2B]"
                  >
                    Status
                  </label>
                  <select
                    id="crm-membership-status-filter"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as (typeof membershipStatuses)[number],
                      )
                    }
                    className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                  >
                    {membershipStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={filteredMemberships.length === 0}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
              >
                  Export CSV
                </button>
              </div>

              <p className="mt-4 text-sm text-[#B8A89A]">
                Showing {filteredMemberships.length} of {memberships.length} memberships.
              </p>
            </div>

            {filteredMemberships.length === 0 ? (
              <p className="text-sm text-[#B8A89A] dark:text-[#8A7D75]">
                No memberships match your filters.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-themed bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="table-themed w-full min-w-[1100px] text-left text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 font-medium">Membership ID</th>
                        <th className="px-4 py-3 font-medium">Client Name</th>
                        <th className="px-4 py-3 font-medium">Client Phone</th>
                        <th className="px-4 py-3 font-medium">Tier</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Days Remaining</th>
                        <th className="px-4 py-3 font-medium">Purchase Date</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMemberships.map((membership) => {
                        const daysRemaining = getDaysRemaining(membership.expiresAt);
                        const isQuotaExpanded = expandedQuotaId === membership.id;
                        const quotaData = quotaByMembershipId[membership.id];
                        const isQuotaLoading = quotaLoadingId === membership.id;

                        return (
                          <Fragment key={membership.id}>
                            <tr>
                              <td className="cell-muted px-4 py-4 font-mono text-xs">
                                {membership.membershipId}
                              </td>
                              <td className="px-4 py-4">
                                {membership.user.name ?? membership.user.email}
                              </td>
                              <td className="cell-muted px-4 py-4">
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
                                  <span className="cell-muted text-sm font-medium">
                                    Pending
                                  </span>
                                ) : daysRemaining === null ? (
                                  <span className="cell-muted text-sm font-medium">
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
                              <td className="cell-muted px-4 py-4">
                                {new Date(membership.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-4">
                                {membership.status === "ACTIVE" ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleQuotaView(membership.id)}
                                    disabled={isQuotaLoading}
                                    className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{
                                      borderColor: "#D8C7B5",
                                      color: "#2B2B2B",
                                      backgroundColor: "#F8F5F0",
                                    }}
                                  >
                                    {isQuotaLoading
                                      ? "Loading quota..."
                                      : isQuotaExpanded
                                        ? "Hide Quota"
                                        : "View Quota"}
                                  </button>
                                ) : (
                                  <span className="text-xs text-[#B8A89A] dark:text-[#8A7D75]">
                                    -
                                  </span>
                                )}
                              </td>
                            </tr>
                            {isQuotaExpanded ? (
                              <tr className="bg-black/[0.02] dark:bg-white/[0.03]">
                                <td colSpan={8} className="px-4 py-5">
                                  {quotaData ? (
                                    <div className="rounded-lg border border-themed bg-card p-4">
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                          <p className="text-sm font-medium text-[#B8A89A] dark:text-[#8A7D75]">
                                            Quota Usage Snapshot
                                          </p>
                                          <p className="mt-2 text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                                            Useful for spotting members near their limit
                                          </p>
                                        </div>
                                        <span
                                          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                                          style={getTierBadgeStyles(membership.tier)}
                                        >
                                          {membership.tier}
                                        </span>
                                      </div>

                                      {quotaData.quota.type === "total" ? (
                                        <div className="mt-4 rounded-xl border border-[#D8C7B5] bg-[#F8F5F0] px-4 py-3 dark:border-[#3D3530] dark:bg-[#2A2724]">
                                          <p className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                                            {quotaData.quota.used} of {quotaData.quota.limit} consultations used
                                          </p>
                                          <p className="mt-2 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
                                            {quotaData.quota.remaining} consultation
                                            {quotaData.quota.remaining === 1 ? "" : "s"} remaining
                                          </p>
                                        </div>
                                      ) : quotaData.quota.type === "specialization" ? (
                                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                                          {specializationKeys.map((key) => {
                                            const quota = (quotaData.quota as SpecializationQuota)[key];
                                            const label = specializationLabels[key];

                                            return (
                                              <div
                                                key={key}
                                                className="rounded-xl border border-[#D8C7B5] bg-[#F8F5F0] px-4 py-3 dark:border-[#3D3530] dark:bg-[#2A2724]"
                                              >
                                                <p className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                                                  {label}
                                                </p>
                                                <p className="mt-2 text-sm font-medium text-[#B8A89A] dark:text-[#8A7D75]">
                                                  {quota.used}/{formatQuotaValue(quota.limit)} used
                                                </p>
                                                <p className="mt-1 text-xs text-[#B8A89A] dark:text-[#8A7D75]">
                                                  {quota.isUnlimited
                                                    ? "Unlimited remaining"
                                                    : `${quota.remaining ?? 0} remaining`}
                                                </p>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <p className="cell-muted text-sm">
                                      Quota details are not available yet.
                                    </p>
                                  )}
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="px-4 pb-4 text-xs text-muted md:hidden">
                  Scroll to see more
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
