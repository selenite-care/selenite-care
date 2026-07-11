"use client";

import Papa from "papaparse";
import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { formatDateTime } from "@/lib/dateUtils";
import { getMembershipPrice } from "@/lib/membershipDiscounts";

type MembershipTier = "SIGNATURE" | "CRYSTAL" | "PLATINUM";
const ITEMS_PER_PAGE = 20;

type AdminMembershipPayment = {
  id: string;
  membershipId: string;
  tier: MembershipTier;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
  };
  payment: {
    id: string;
    amount: number;
    status: string;
    stripePaymentId: string;
    createdAt: string;
  } | null;
};

function getTierBadgeClasses(tier: MembershipTier) {
  switch (tier) {
    case "SIGNATURE":
      return {
        backgroundColor: "#B87B68",
        color: "#F8F5F0",
      };
    case "CRYSTAL":
      return {
        backgroundColor: "#DBEAFE",
        color: "#1D4ED8",
      };
    case "PLATINUM":
      return {
        backgroundColor: "#2B2B2B",
        color: "#F8F5F0",
      };
    default:
      return {
        backgroundColor: "#F8F5F0",
        color: "#2B2B2B",
      };
  }
}

function formatTierLabel(tier: MembershipTier) {
  switch (tier) {
    case "SIGNATURE":
      return "Signature";
    case "CRYSTAL":
      return "Crystal";
    case "PLATINUM":
      return "Platinum";
    default:
      return tier;
  }
}

function getMembershipAmount(tier: MembershipTier) {
  return `${getMembershipPrice(tier).toLocaleString("en-US")} BDT`;
}

export default function AdminPaymentsPage() {
  const [memberships, setMemberships] = useState<AdminMembershipPayment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  useEffect(() => {
    const controller = new AbortController();

    async function loadMembershipPayments() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
        });
        const trimmedSearch = searchQuery.trim();

        if (trimmedSearch) {
          params.set("search", trimmedSearch);
        }

        const response = await fetch(`/api/admin/memberships?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load membership payments.");
        }

        const data = (await response.json()) as {
          memberships?: AdminMembershipPayment[];
          totalCount?: number;
        };

        setMemberships(data.memberships ?? []);
        setTotalCount(data.totalCount ?? 0);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError("Membership payments are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadMembershipPayments();
    return () => controller.abort();
  }, [currentPage, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  function handleExportCsv() {
    const csv = Papa.unparse(
      memberships.map((membership) => ({
        "Membership ID": membership.membershipId,
        "Client Name": membership.user.name ?? membership.user.email,
        "Client Phone": membership.user.phone ?? "",
        "Client Email": membership.user.email,
        Tier: formatTierLabel(membership.tier),
        Amount: getMembershipAmount(membership.tier),
        "Payment Status": membership.payment?.status ?? "UNPAID",
        "Purchase Date": formatDateTime(membership.createdAt),
      })),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "selenite-care-membership-payments.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{
            fontFamily: "Playfair Display, serif",
          }}>
          Membership Payments
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
          Review membership purchases and their payment status.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-foreground/70">
          Loading membership payments...
        </p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && totalCount === 0 && !searchQuery.trim() ? (
        <p className="mt-8 text-sm text-foreground/70">
          No membership payments found.
        </p>
      ) : null}

      {!isLoading && !error && (totalCount > 0 || searchQuery.trim()) ? (
        <>
          <div className="mt-8 rounded-lg border border-[#EADDCD] bg-white p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label
                  htmlFor="membership-payment-search"
                  className="text-sm font-medium text-[#2B2B2B]"
                >
                  Search membership payments
                </label>
                <input
                  id="membership-payment-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Membership ID, client name, email, phone, tier, or payment status"
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#884F38] focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68]"
                />
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={memberships.length === 0}
                className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: "#2B2B2B",
                  color: "#F8F5F0",
                }}
              >
                Export CSV
              </button>
            </div>

            <p className="mt-4 text-sm text-[#884F38]">
              Showing {memberships.length} of {totalCount} membership payments.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-themed bg-card">
            <div className="overflow-x-auto">
              <table className="table-themed w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-medium">Membership ID</th>
                    <th className="px-4 py-3 font-medium">Client Name</th>
                    <th className="px-4 py-3 font-medium">Client Phone</th>
                    <th className="px-4 py-3 font-medium">Client Email</th>
                    <th className="px-4 py-3 font-medium">Tier</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Payment Status</th>
                    <th className="px-4 py-3 font-medium">Purchase Date</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="cell-muted px-4 py-8 text-center text-sm">
                        No membership payments match your search.
                      </td>
                    </tr>
                  ) : (
                    memberships.map((membership) => {
                      const tierBadgeStyles = getTierBadgeClasses(membership.tier);

                      return (
                        <tr key={membership.id}>
                          <td className="cell-muted px-4 py-4 font-mono text-xs">
                            {membership.membershipId}
                          </td>
                          <td className="px-4 py-4">
                            {membership.user.name ?? membership.user.email}
                          </td>
                          <td className="cell-muted px-4 py-4">
                            {membership.user.phone ?? "Not provided"}
                          </td>
                          <td className="cell-muted px-4 py-4">
                            {membership.user.email}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                              style={tierBadgeStyles}
                            >
                              {formatTierLabel(membership.tier)}
                            </span>
                          </td>
                          <td className="cell-muted px-4 py-4">
                            {getMembershipAmount(membership.tier)}
                          </td>
                          <td className="cell-muted px-4 py-4">
                            {membership.payment?.status ?? "UNPAID"}
                          </td>
                          <td className="cell-muted px-4 py-4">
                            {formatDateTime(membership.createdAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p className="px-4 pb-4 text-xs text-muted md:hidden">
              Scroll to see more
            </p>
          </div>

          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalCount}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}
