"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";

type AdminInfluencer = {
  id: string;
  referralCode: string;
  commissionRate: number;
  totalEarned: number;
  totalPaid: number;
  isActive: boolean;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
  };
  _count: {
    referrals: number;
  };
};

type InfluencersResponse = {
  influencers?: AdminInfluencer[];
  error?: string;
};

function formatBdt(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")} BDT`;
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-[#EADDCD] px-2 text-xs font-medium text-[#884F38] transition-colors hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:text-[#D4B47A]"
    >
      <Copy aria-hidden="true" className="h-3.5 w-3.5" />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function AdminInfluencersPage() {
  const [influencers, setInfluencers] = useState<AdminInfluencer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadInfluencers() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/admin/influencers", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | InfluencersResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load influencers.");
        }

        setInfluencers(data?.influencers ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load influencers.",
        );
        setInfluencers([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadInfluencers();
  }, []);

  const stats = useMemo(() => {
    const totalCommissionPaid = influencers.reduce(
      (sum, influencer) => sum + influencer.totalPaid,
      0,
    );
    const totalPending = influencers.reduce(
      (sum, influencer) =>
        sum + Math.max(0, influencer.totalEarned - influencer.totalPaid),
      0,
    );
    const totalReferralSales = influencers.reduce(
      (sum, influencer) => sum + influencer._count.referrals,
      0,
    );

    return [
      {
        label: "Total Influencers",
        value: influencers.length.toLocaleString("en-US"),
      },
      {
        label: "Total Commission Paid",
        value: formatBdt(totalCommissionPaid),
      },
      {
        label: "Total Pending",
        value: formatBdt(totalPending),
      },
      {
        label: "Total Referral Sales",
        value: totalReferralSales.toLocaleString("en-US"),
      },
    ];
  }, [influencers]);

  async function handleActiveToggle(influencerId: string, isActive: boolean) {
    if (updatingId) {
      return;
    }

    setUpdatingId(influencerId);
    setError("");

    try {
      const response = await fetch(`/api/admin/influencers/${influencerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      const data = (await response.json().catch(() => null)) as
        | { influencer?: { id: string; isActive: boolean }; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to update influencer.");
      }

      setInfluencers((current) =>
        current.map((influencer) =>
          influencer.id === influencerId
            ? { ...influencer, isActive: data?.influencer?.isActive ?? isActive }
            : influencer,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update influencer.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Influencers
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
          Manage referral partners, commissions, and influencer status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[#EADDCD] bg-white p-5 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967] dark:text-[#8A7D75]">
              {stat.label}
            </p>
            <p
              className="mt-3 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-themed bg-card">
        <div className="overflow-x-auto">
          <table className="table-themed w-full min-w-[1180px] text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium">Influencer</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Referral Code</th>
                <th className="px-4 py-3 font-medium">Commission Rate</th>
                <th className="px-4 py-3 font-medium">Referrals</th>
                <th className="px-4 py-3 font-medium">Total Earned</th>
                <th className="px-4 py-3 font-medium">Total Paid</th>
                <th className="px-4 py-3 font-medium">Pending Balance</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="cell-muted px-4 py-8 text-center text-sm"
                  >
                    Loading influencers...
                  </td>
                </tr>
              ) : influencers.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="cell-muted px-4 py-8 text-center text-sm"
                  >
                    No influencers found.
                  </td>
                </tr>
              ) : (
                influencers.map((influencer) => {
                  const pendingBalance = Math.max(
                    0,
                    influencer.totalEarned - influencer.totalPaid,
                  );

                  return (
                    <tr key={influencer.id}>
                      <td className="px-4 py-4 font-medium">
                        {influencer.user.name ?? "Not set"}
                      </td>
                      <td className="cell-muted px-4 py-4">
                        {influencer.user.email}
                      </td>
                      <td className="cell-muted px-4 py-4">
                        {influencer.user.phone ?? "Not set"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[#D4B47A]">
                            {influencer.referralCode}
                          </span>
                          <CopyCodeButton code={influencer.referralCode} />
                        </div>
                      </td>
                      <td className="cell-muted px-4 py-4">
                        {influencer.commissionRate}%
                      </td>
                      <td className="cell-muted px-4 py-4">
                        {influencer._count.referrals}
                      </td>
                      <td className="cell-muted px-4 py-4">
                        {formatBdt(influencer.totalEarned)}
                      </td>
                      <td className="cell-muted px-4 py-4">
                        {formatBdt(influencer.totalPaid)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#B87B68]">
                        {formatBdt(pendingBalance)}
                      </td>
                      <td className="px-4 py-4">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={influencer.isActive}
                            onChange={(event) =>
                              void handleActiveToggle(
                                influencer.id,
                                event.target.checked,
                              )
                            }
                            disabled={updatingId === influencer.id}
                            className="h-4 w-4 accent-[#B87B68] disabled:cursor-not-allowed disabled:opacity-60"
                          />
                          <span className="text-xs text-[#6E6257] dark:text-[#8A7D75]">
                            {influencer.isActive ? "Active" : "Inactive"}
                          </span>
                        </label>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/influencers/${influencer.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-md border border-[#B87B68] px-3 text-xs font-semibold text-[#884F38] transition-colors hover:bg-[#F8F5F0] dark:border-[#8A7D75] dark:text-[#F0EDE8] dark:hover:bg-[#242220]"
                        >
                          View Details
                        </Link>
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
    </section>
  );
}
