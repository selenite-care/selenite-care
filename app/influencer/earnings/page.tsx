"use client";

import { useEffect, useMemo, useState } from "react";

type InfluencerPayment = {
  id: string;
  amount: number;
  method: string;
  note: string | null;
  paidBy: string | null;
  paidAt: string;
};

type PendingReferral = {
  id: string;
  commissionAmount: number;
  createdAt: string;
  client: {
    name: string | null;
  };
  membership: {
    tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
  };
};

type EarningsResponse = {
  totalEarned?: number;
  totalPaid?: number;
  pendingBalance?: number;
  payments?: InfluencerPayment[];
  pendingReferrals?: PendingReferral[];
  error?: string;
};

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

function formatPaymentMethod(method: string) {
  const normalizedMethod = method.trim().toUpperCase();

  if (normalizedMethod === "BKASH") {
    return "bKash";
  }

  if (normalizedMethod === "CASH") {
    return "Cash";
  }

  return method;
}

export default function InfluencerEarningsPage() {
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [payments, setPayments] = useState<InfluencerPayment[]>([]);
  const [pendingReferrals, setPendingReferrals] = useState<PendingReferral[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const pendingCommissionTotal = useMemo(
    () =>
      pendingReferrals.reduce(
        (total, referral) => total + referral.commissionAmount,
        0,
      ),
    [pendingReferrals],
  );
  const summary = [
    {
      label: "Total Earned",
      value: formatBdt(totalEarned),
      isHighlighted: false,
    },
    {
      label: "Total Paid",
      value: formatBdt(totalPaid),
      isHighlighted: false,
    },
    {
      label: "Pending Balance",
      value: formatBdt(pendingBalance),
      isHighlighted: pendingBalance > 0,
    },
  ];

  useEffect(() => {
    async function loadEarnings() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/influencer/earnings", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | EarningsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load earnings.");
        }

        setTotalEarned(data?.totalEarned ?? 0);
        setTotalPaid(data?.totalPaid ?? 0);
        setPendingBalance(data?.pendingBalance ?? 0);
        setPayments(data?.payments ?? []);
        setPendingReferrals(data?.pendingReferrals ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load earnings.");
        setTotalEarned(0);
        setTotalPaid(0);
        setPendingBalance(0);
        setPayments([]);
        setPendingReferrals([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadEarnings();
  }, []);

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
          Earnings
        </h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-[#8C7967] dark:text-[#8A7D75]">
          Loading earnings...
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {summary.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-5 shadow-sm ${
                  item.isHighlighted
                    ? "border-[#D4B47A] bg-[rgba(212,180,122,0.16)] dark:bg-[rgba(212,180,122,0.12)]"
                    : "border-[#EADDCD] bg-white dark:border-[#3D3530] dark:bg-[#242220]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967] dark:text-[#8A7D75]">
                  {item.label}
                </p>
                <p
                  className={`mt-3 text-3xl font-semibold ${
                    item.isHighlighted
                      ? "text-[#B87B68] dark:text-[#D4B47A]"
                      : "text-[#2B2B2B] dark:text-[#F0EDE8]"
                  }`}
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7967] dark:text-[#8A7D75]">
                Payment History
              </p>
              <h2
                className="mt-2 text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Payout records
              </h2>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#EADDCD] text-xs uppercase tracking-[0.12em] text-[#8C7967] dark:border-[#3D3530] dark:text-[#8A7D75]">
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Amount</th>
                    <th className="px-3 py-3 font-semibold">Method</th>
                    <th className="px-3 py-3 font-semibold">Note</th>
                    <th className="px-3 py-3 font-semibold">Paid By</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-8 text-center text-sm text-[#8C7967] dark:text-[#8A7D75]"
                      >
                        No payments yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-[#F0E6D8] last:border-0 dark:border-[#3D3530]"
                      >
                        <td className="px-3 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                          {formatDate(payment.paidAt)}
                        </td>
                        <td className="px-3 py-4 font-semibold text-[#B87B68]">
                          {formatBdt(payment.amount)}
                        </td>
                        <td className="px-3 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                          {formatPaymentMethod(payment.method)}
                        </td>
                        <td className="px-3 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                          {payment.note || "-"}
                        </td>
                        <td className="px-3 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                          {payment.paidBy || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7967] dark:text-[#8A7D75]">
                Pending Commissions
              </p>
              <h2
                className="mt-2 text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Awaiting payout
              </h2>
            </div>

            <div className="mt-5 divide-y divide-[#F0E6D8] dark:divide-[#3D3530]">
              {pendingReferrals.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#8C7967] dark:text-[#8A7D75]">
                  No pending commissions.
                </p>
              ) : (
                pendingReferrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="grid gap-3 py-4 text-sm md:grid-cols-[1fr_140px_160px_140px] md:items-center"
                  >
                    <div>
                      <p className="font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                        {getPrivateClientName(referral.client.name)}
                      </p>
                      <p className="mt-1 text-xs text-[#8C7967] dark:text-[#8A7D75]">
                        {formatDate(referral.createdAt)}
                      </p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-[#EADDCD] px-3 py-1 text-xs font-semibold text-[#884F38] dark:bg-[#3D3530] dark:text-[#D4B47A]">
                      {referral.membership.tier}
                    </span>
                    <p className="font-semibold text-[#B87B68]">
                      {formatBdt(referral.commissionAmount)}
                    </p>
                    <p className="text-[#6E6257] dark:text-[#8A7D75]">
                      Pending
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2 rounded-xl border border-[#D4B47A] bg-[rgba(212,180,122,0.12)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                Total Pending
              </p>
              <p
                className="text-2xl font-semibold text-[#B87B68] dark:text-[#D4B47A]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {formatBdt(pendingCommissionTotal)}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#D4B47A] bg-[rgba(212,180,122,0.12)] p-5 text-sm leading-7 text-[#6E6257] dark:text-[#F0EDE8]">
            Payments are made weekly via bKash or cash. Minimum payout: 500 BDT.
            Contact admin for payment queries.
          </section>
        </>
      ) : null}
    </div>
  );
}
