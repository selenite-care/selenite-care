"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

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

const membershipStatuses = [
  "All",
  "PENDING",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
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

export default function CrmMembershipsPage() {
  const [memberships, setMemberships] = useState<CrmMembership[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof membershipStatuses)[number]>("All");
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

                        return (
                            <tr key={membership.id}>
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
                                <span className="text-xs text-[#B8A89A] dark:text-[#8A7D75]">
                                  -
                                </span>
                              </td>
                            </tr>
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
