"use client";

import Papa from "papaparse";
import { Fragment, useEffect, useMemo, useState } from "react";

type AdminMembership = {
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
  payment: {
    id: string;
    status: "UNPAID" | "PAID" | "REFUNDED";
  } | null;
};

type MembershipResponse = {
  memberships?: AdminMembership[];
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

function getTierBadgeStyles(tier: AdminMembership["tier"]) {
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

function getStatusBadgeStyles(status: AdminMembership["status"]) {
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

function getPaymentBadgeStyles(status: "UNPAID" | "PAID" | "REFUNDED" | "N/A") {
  switch (status) {
    case "PAID":
      return {
        backgroundColor: "rgba(34, 197, 94, 0.12)",
        color: "#166534",
      };
    case "UNPAID":
      return {
        backgroundColor: "rgba(198, 165, 107, 0.14)",
        color: "#8A6A2F",
      };
    case "REFUNDED":
      return {
        backgroundColor: "rgba(107, 114, 128, 0.16)",
        color: "#4B5563",
      };
    case "N/A":
      return {
        backgroundColor: "rgba(107, 114, 128, 0.16)",
        color: "#4B5563",
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

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<AdminMembership[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof membershipStatuses)[number]>("All");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedQuotaId, setExpandedQuotaId] = useState<string | null>(null);
  const [quotaByMembershipId, setQuotaByMembershipId] = useState<
    Record<string, MembershipQuotaResponse>
  >({});
  const [quotaLoadingId, setQuotaLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMemberships() {
      try {
        const response = await fetch("/api/admin/memberships");
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

  async function updateMembershipStatus(membershipId: string, status: "CANCELLED") {
    setUpdatingId(membershipId);
    setError("");

    try {
      const response = await fetch(`/api/admin/memberships/${membershipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => null)) as
        | { membership?: AdminMembership; error?: string }
        | null;

      if (!response.ok || !data?.membership) {
        throw new Error(data?.error ?? "Unable to update membership.");
      }

      setMemberships((current) =>
        current.map((membership) =>
          membership.id === membershipId ? data.membership! : membership,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update membership.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

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
      const response = await fetch(`/api/admin/memberships/${membershipId}/quota`);
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
      const paymentStatus = membership.payment?.status ?? "N/A";
      const matchesSearch =
        !normalizedQuery ||
        membership.membershipId.toLowerCase().includes(normalizedQuery) ||
        clientName.toLowerCase().includes(normalizedQuery) ||
        membership.user.email.toLowerCase().includes(normalizedQuery) ||
        (membership.user.phone ?? "").toLowerCase().includes(normalizedQuery) ||
        membership.tier.toLowerCase().includes(normalizedQuery) ||
        paymentStatus.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "All" || membership.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [memberships, searchQuery, statusFilter]);

  const hasMemberships = useMemo(
    () => memberships.length > 0,
    [memberships],
  );

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
              : membership.status === "ACTIVE" && daysRemaining !== null
                ? daysRemaining > 0
                  ? String(daysRemaining)
                  : "Expired"
                : membership.status === "EXPIRED"
                  ? "Expired"
                  : "-",
          "Payment Status": membership.payment?.status ?? "N/A",
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

  async function handleCancelMembership(membershipId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this membership? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    await updateMembershipStatus(membershipId, "CANCELLED");
  }

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{
            fontFamily: "Playfair Display, serif",
          }}
        >
          Memberships
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
          Review membership purchases and keep an eye on expiry windows.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
          Loading memberships...
        </p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && !hasMemberships ? (
        <p className="mt-8 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
          No memberships found.
        </p>
      ) : null}

      {!isLoading && hasMemberships ? (
        <>
          <div className="mt-8 rounded-lg border border-[#D8C7B5] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220]">
            <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
              <div>
                <label
                  htmlFor="membership-search"
                  className="text-sm font-medium text-[#2B2B2B]"
                >
                  Search memberships
                </label>
                <input
                  id="membership-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Membership ID, client name, email, phone, tier, or payment status"
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                />
              </div>

              <div>
                <label
                  htmlFor="membership-status-filter"
                  className="text-sm font-medium text-[#2B2B2B]"
                >
                  Status
                </label>
                <select
                  id="membership-status-filter"
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
            <p className="mt-8 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
              No memberships match your filters.
            </p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-themed bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="table-themed w-full min-w-[1120px] text-left text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 font-medium">Membership ID</th>
                      <th className="px-4 py-3 font-medium">Client Name</th>
                      <th className="px-4 py-3 font-medium">Client Phone</th>
                      <th className="px-4 py-3 font-medium">Tier</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Days Remaining</th>
                      <th className="px-4 py-3 font-medium">Payment Status</th>
                      <th className="px-4 py-3 font-medium">Purchase Date</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMemberships.map((membership) => {
                      const paymentStatus = membership.payment?.status ?? "N/A";
                      const isUpdating = updatingId === membership.id;
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
                              ) : membership.status === "ACTIVE" && daysRemaining !== null ? (
                                daysRemaining > 0 ? (
                                  <span className="text-sm font-medium text-emerald-600">
                                    {daysRemaining} day{daysRemaining === 1 ? "" : "s"}
                                  </span>
                                ) : (
                                  <span className="text-sm font-medium text-red-600">
                                    Expired
                                  </span>
                                )
                              ) : membership.status === "EXPIRED" ? (
                                <span className="text-sm font-medium text-red-600">
                                  Expired
                                </span>
                              ) : (
                                <span className="cell-muted text-sm font-medium">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                                style={getPaymentBadgeStyles(paymentStatus)}
                              >
                                {paymentStatus}
                              </span>
                            </td>
                            <td className="cell-muted px-4 py-4">
                              {new Date(membership.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
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
                                ) : null}
                                {membership.status === "ACTIVE" ||
                                membership.status === "PENDING" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelMembership(membership.id)}
                                    disabled={isUpdating}
                                    className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{
                                      borderColor: "#C6A56B",
                                      color: "#2B2B2B",
                                      backgroundColor: "#FFFFFF",
                                    }}
                                  >
                                    {isUpdating ? "Cancelling..." : "Cancel"}
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                          {isQuotaExpanded ? (
                            <tr className="bg-black/[0.02] dark:bg-white/[0.03]">
                              <td colSpan={9} className="px-4 py-5">
                                {quotaData ? (
                                  <div className="rounded-lg border border-themed bg-card p-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-[#B8A89A] dark:text-[#8A7D75]">
                                          Consultation Usage Breakdown
                                        </p>
                                        <p className="mt-2 text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                                          Current usage within this membership period
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
    </section>
  );
}
