"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/ui/Pagination";

type ReferralStatus = "PENDING" | "PAID" | "CANCELLED";
type MembershipTier = "SIGNATURE" | "CRYSTAL" | "PLATINUM";
type DateFilter = "week" | "month" | "last-month" | "all";

type InfluencerReferral = {
  id: string;
  originalAmount: number;
  discountAmount: number;
  clientPaid: number;
  commissionAmount: number;
  status: ReferralStatus;
  createdAt: string;
  client: {
    name: string | null;
  };
  membership: {
    tier: MembershipTier;
  };
};

type ReferralsResponse = {
  referrals?: InfluencerReferral[];
  error?: string;
};

const ITEMS_PER_PAGE = 20;
const DATE_FILTERS: Array<{ value: DateFilter; label: string }> = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "all", label: "All Time" },
];

function formatBdt(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")} BDT`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getPrivateClientName(name: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (parts.length === 0) {
    return "Client";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function getStartOfWeek(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  return nextDate;
}

function isInDateFilter(value: string, filter: DateFilter) {
  if (filter === "all") {
    return true;
  }

  const date = new Date(value);
  const now = new Date();

  if (filter === "week") {
    return date >= getStartOfWeek(now);
  }

  if (filter === "month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return (
    date.getFullYear() === lastMonth.getFullYear() &&
    date.getMonth() === lastMonth.getMonth()
  );
}

function getTierClasses(tier: MembershipTier) {
  switch (tier) {
    case "PLATINUM":
      return "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
    case "CRYSTAL":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300";
    case "SIGNATURE":
    default:
      return "bg-[#EADDCD] text-[#884F38] dark:bg-[#3D3530] dark:text-[#D4B47A]";
  }
}

function getStatusClasses(status: ReferralStatus) {
  switch (status) {
    case "PAID":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300";
    case "PENDING":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
    case "CANCELLED":
    default:
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
  }
}

export default function InfluencerReferralsPage() {
  const [referrals, setReferrals] = useState<InfluencerReferral[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReferrals() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/influencer/referrals", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | ReferralsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load referrals.");
        }

        setReferrals(data?.referrals ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load referrals.",
        );
        setReferrals([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadReferrals();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter]);

  const filteredReferrals = useMemo(
    () =>
      referrals.filter((referral) =>
        isInDateFilter(referral.createdAt, dateFilter),
      ),
    [dateFilter, referrals],
  );
  const thisMonthReferrals = useMemo(
    () =>
      referrals.filter((referral) =>
        isInDateFilter(referral.createdAt, "month"),
      ).length,
    [referrals],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredReferrals.length / ITEMS_PER_PAGE),
  );
  const paginatedReferrals = filteredReferrals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredReferrals.map((referral) => ({
        Date: formatDate(referral.createdAt),
        Client: getPrivateClientName(referral.client.name),
        "Membership Tier": referral.membership.tier,
        "Original Price": Math.round(referral.originalAmount),
        "Discount Given": Math.round(referral.discountAmount),
        "Client Paid": Math.round(referral.clientPaid),
        "Your Commission": Math.round(referral.commissionAmount),
        Status: referral.status,
      })),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "selenite-care-referrals.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#B87B68]">
          Influencer Dashboard
        </p>
        <h1
          className="mt-2 text-3xl font-bold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          My Referrals
        </h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#EADDCD] bg-white p-5 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967] dark:text-[#8A7D75]">
            Total Referrals
          </p>
          <p className="mt-3 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
            {referrals.length.toLocaleString("en-US")}
          </p>
        </div>
        <div className="rounded-2xl border border-[#EADDCD] bg-white p-5 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967] dark:text-[#8A7D75]">
            This Month
          </p>
          <p className="mt-3 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
            {thisMonthReferrals.toLocaleString("en-US")}
          </p>
        </div>
        <div className="rounded-2xl border border-[#EADDCD] bg-white p-5 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967] dark:text-[#8A7D75]">
            Conversion Rate
          </p>
          <p className="mt-3 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
            Coming Soon
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7967] dark:text-[#8A7D75]">
              Referral Sales
            </p>
            <h2
              className="mt-2 text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Referral history
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-col gap-2 text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Date Range
              <select
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value as DateFilter)
                }
                className="h-11 rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
              >
                {DATE_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredReferrals.length === 0}
              className="inline-flex h-11 items-center justify-center self-end rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#B87B68] dark:text-[#141210]"
            >
              Export CSV
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-[#8C7967] dark:text-[#8A7D75]">
            Loading referrals...
          </p>
        ) : null}

        {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

        {!isLoading && !error ? (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#EADDCD] text-xs uppercase tracking-[0.12em] text-[#8C7967] dark:border-[#3D3530] dark:text-[#8A7D75]">
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Client</th>
                    <th className="px-3 py-3 font-semibold">Membership Tier</th>
                    <th className="px-3 py-3 font-semibold">Original Price</th>
                    <th className="px-3 py-3 font-semibold">Discount Given</th>
                    <th className="px-3 py-3 font-semibold">Client Paid</th>
                    <th className="px-3 py-3 font-semibold">Your Commission</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReferrals.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-8 text-center text-sm text-[#8C7967] dark:text-[#8A7D75]"
                      >
                        No referrals match this date range.
                      </td>
                    </tr>
                  ) : (
                    paginatedReferrals.map((referral) => (
                      <tr
                        key={referral.id}
                        className="border-b border-[#F0E6D8] last:border-0 dark:border-[#3D3530]"
                      >
                        <td className="px-3 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                          {formatDate(referral.createdAt)}
                        </td>
                        <td className="px-3 py-4 font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {getPrivateClientName(referral.client.name)}
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getTierClasses(
                              referral.membership.tier,
                            )}`}
                          >
                            {referral.membership.tier}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                          {formatBdt(referral.originalAmount)}
                        </td>
                        <td className="px-3 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                          {formatBdt(referral.discountAmount)}
                        </td>
                        <td className="px-3 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                          {formatBdt(referral.clientPaid)}
                        </td>
                        <td className="px-3 py-4 font-semibold text-[#B87B68]">
                          {formatBdt(referral.commissionAmount)}
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              referral.status,
                            )}`}
                          >
                            {referral.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredReferrals.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
