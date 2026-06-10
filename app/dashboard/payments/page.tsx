"use client";

import { useEffect, useState } from "react";

type ClientPayment = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  stripePaymentId: string;
  membership: {
    membershipId: string;
    tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
    status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
    createdAt: string;
    expiresAt: string | null;
  };
};

function getTierBadgeClasses(tier: ClientPayment["membership"]["tier"]) {
  switch (tier) {
    case "PLATINUM":
      return "bg-[#2B2B2B] text-[#F8F5F0]";
    case "CRYSTAL":
      return "bg-blue-50 text-blue-700";
    case "SIGNATURE":
    default:
      return "bg-[#F5EBD9] text-[#8A6A2F]";
  }
}

function getPaymentStatusBadgeClasses(status: string) {
  switch (status) {
    case "UNPAID":
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-300";
    case "PAID":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300";
    case "REFUNDED":
      return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    default:
      return "border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5";
  }
}

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

export default function DashboardPaymentsPage() {
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        const response = await fetch("/api/client/payments");

        if (!response.ok) {
          throw new Error("Unable to load payments.");
        }

        const data = (await response.json()) as {
          payments?: ClientPayment[];
        };

        setPayments(data.payments ?? []);
      } catch {
        setError("Payments are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPayments();
  }, []);

  return (
    <section>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          My Payments
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Review your payment history for your membership purchases.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-foreground/70">Loading payments...</p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && payments.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/70">
          You have not made any payments yet.
        </p>
      ) : null}

      {!isLoading && !error && payments.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Membership ID</th>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Payment Status</th>
                  <th className="px-4 py-3 font-medium">Purchase Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-black/10 last:border-0 dark:border-white/10"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-foreground/70">
                      {payment.membership.membershipId}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${getTierBadgeClasses(
                          payment.membership.tier,
                        )}`}
                      >
                        {payment.membership.tier}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      {formatBdt(payment.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getPaymentStatusBadgeClasses(
                          payment.status,
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
