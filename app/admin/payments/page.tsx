"use client";

import Papa from "papaparse";
import { useEffect, useState } from "react";
import { useMemo } from "react";

type MembershipTier = "SIGNATURE" | "CRYSTAL" | "PLATINUM";

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
        backgroundColor: "#C6A56B",
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
  switch (tier) {
    case "SIGNATURE":
      return "490 BDT";
    case "CRYSTAL":
      return "3990 BDT";
    case "PLATINUM":
      return "9990 BDT";
    default:
      return "0 BDT";
  }
}

export default function AdminPaymentsPage() {
  const [memberships, setMemberships] = useState<AdminMembershipPayment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMembershipPayments() {
      try {
        const response = await fetch("/api/admin/memberships");

        if (!response.ok) {
          throw new Error("Unable to load membership payments.");
        }

        const data = (await response.json()) as {
          memberships?: AdminMembershipPayment[];
        };
        setMemberships(data.memberships ?? []);
      } catch {
        setError("Membership payments are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadMembershipPayments();
  }, []);

  const filteredMemberships = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return memberships.filter((membership) => {
      const clientName = membership.user.name ?? membership.user.email;
      return (
        !normalizedQuery ||
        membership.membershipId.toLowerCase().includes(normalizedQuery) ||
        clientName.toLowerCase().includes(normalizedQuery) ||
        membership.user.email.toLowerCase().includes(normalizedQuery) ||
        (membership.user.phone ?? "").toLowerCase().includes(normalizedQuery) ||
        membership.tier.toLowerCase().includes(normalizedQuery) ||
        (membership.payment?.status ?? "UNPAID").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [memberships, searchQuery]);

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredMemberships.map((membership) => ({
        "Membership ID": membership.membershipId,
        "Client Name": membership.user.name ?? membership.user.email,
        "Client Phone": membership.user.phone ?? "",
        "Client Email": membership.user.email,
        Tier: formatTierLabel(membership.tier),
        Amount: getMembershipAmount(membership.tier),
        "Payment Status": membership.payment?.status ?? "UNPAID",
        "Purchase Date": new Date(membership.createdAt).toLocaleString(),
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
    <section>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Membership Payments
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Review membership purchases and their payment status.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-foreground/70">
          Loading membership payments...
        </p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && memberships.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/70">
          No membership payments found.
        </p>
      ) : null}

      {!isLoading && !error && memberships.length > 0 ? (
        <>
          <div className="mt-8 rounded-lg border border-[#D8C7B5] bg-white p-4">
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
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                />
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredMemberships.length === 0}
                className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: "#2B2B2B",
                  color: "#F8F5F0",
                }}
              >
                Export CSV
              </button>
            </div>

            <p className="mt-4 text-sm text-[#B8A89A]">
              Showing {filteredMemberships.length} of {memberships.length} membership payments.
            </p>
          </div>

          {filteredMemberships.length === 0 ? (
            <p className="mt-8 text-sm text-foreground/70">
              No membership payments match your search.
            </p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
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
                    {filteredMemberships.map((membership) => {
                  const tierBadgeStyles = getTierBadgeClasses(membership.tier);

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
                        {membership.user.phone ?? "Not provided"}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
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
                      <td className="px-4 py-4 text-foreground/70">
                        {getMembershipAmount(membership.tier)}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {membership.payment?.status ?? "UNPAID"}
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
          )}
        </>
      ) : null}
    </section>
  );
}
