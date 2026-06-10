"use client";

import { useEffect, useState } from "react";

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
      return "2900 BDT";
    case "PLATINUM":
      return "6900 BDT";
    default:
      return "0 BDT";
  }
}

export default function AdminPaymentsPage() {
  const [memberships, setMemberships] = useState<AdminMembershipPayment[]>([]);
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
        <div className="mt-8 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
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
                {memberships.map((membership) => {
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
      ) : null}
    </section>
  );
}
