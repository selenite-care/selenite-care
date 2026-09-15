"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type ReferralStatus = "PENDING" | "PAID" | "CANCELLED";

type InfluencerDetails = {
  id: string;
  referralCode: string;
  commissionRate: number;
  isActive: boolean;
  totalEarned: number;
  totalPaid: number;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
    createdAt: string;
  };
  referrals: Array<{
    id: string;
    originalAmount: number;
    discountAmount: number;
    clientPaid: number;
    commissionAmount: number;
    companyReceives: number;
    status: ReferralStatus;
    createdAt: string;
    client: {
      name: string | null;
      email: string;
      phone: string | null;
    };
    membership: {
      membershipId: string;
      tier: string;
      status: string;
    };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    note: string | null;
    paidBy: string | null;
    paidAt: string;
  }>;
};

type InfluencerResponse = {
  influencer?: InfluencerDetails;
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

function getStatusClasses(status: ReferralStatus) {
  switch (status) {
    case "PAID":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300";
    case "PENDING":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
    default:
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
  }
}

export default function AdminInfluencerDetailsPage() {
  const params = useParams<{ id: string }>();
  const influencerId = params.id;
  const [influencer, setInfluencer] = useState<InfluencerDetails | null>(null);
  const [commissionRate, setCommissionRate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BKASH");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const pendingBalance = influencer
    ? Math.max(0, influencer.totalEarned - influencer.totalPaid)
    : 0;
  const pendingReferralTotal = useMemo(
    () =>
      influencer?.referrals
        .filter((referral) => referral.status === "PENDING")
        .reduce((sum, referral) => sum + referral.commissionAmount, 0) ?? 0,
    [influencer],
  );

  async function loadInfluencer() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/admin/influencers/${influencerId}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | InfluencerResponse
        | null;

      if (!response.ok || !data?.influencer) {
        throw new Error(data?.error ?? "Unable to load influencer.");
      }

      setInfluencer(data.influencer);
      setCommissionRate(String(data.influencer.commissionRate));
      setPaymentAmount(String(Math.max(0, data.influencer.totalEarned - data.influencer.totalPaid)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load influencer.");
      setInfluencer(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInfluencer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [influencerId]);

  async function handleSaveSettings() {
    if (!influencer || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/influencers/${influencer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commissionRate: Number(commissionRate),
          isActive: influencer.isActive,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | {
            influencer?: {
              commissionRate: number;
              isActive: boolean;
            };
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save influencer.");
      }

      setInfluencer((current) =>
        current
          ? {
              ...current,
              commissionRate:
                data?.influencer?.commissionRate ?? Number(commissionRate),
              isActive: data?.influencer?.isActive ?? current.isActive,
            }
          : current,
      );
      setMessage("Influencer settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save influencer.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleActiveToggle(isActive: boolean) {
    if (!influencer || isSaving) {
      return;
    }

    setInfluencer({ ...influencer, isActive });
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/influencers/${influencer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      const data = (await response.json().catch(() => null)) as
        | { influencer?: { isActive: boolean }; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to update status.");
      }

      setInfluencer((current) =>
        current
          ? { ...current, isActive: data?.influencer?.isActive ?? isActive }
          : current,
      );
    } catch (err) {
      setInfluencer((current) =>
        current ? { ...current, isActive: !isActive } : current,
      );
      setError(err instanceof Error ? err.message : "Unable to update status.");
    } finally {
      setIsSaving(false);
    }
  }

  function openPaymentModal() {
    setPaymentAmount(String(pendingBalance));
    setPaymentMethod("BKASH");
    setPaymentNote("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setIsPaymentModalOpen(true);
  }

  async function handleRecordPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!influencer || isRecordingPayment) {
      return;
    }

    setIsRecordingPayment(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/influencers/${influencer.id}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Number(paymentAmount),
            method: paymentMethod,
            note: paymentNote,
            paidAt: paymentDate,
          }),
        },
      );
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to record payment.");
      }

      setIsPaymentModalOpen(false);
      setMessage("Payment recorded.");
      await loadInfluencer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record payment.");
    } finally {
      setIsRecordingPayment(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading influencer...</p>;
  }

  if (!influencer) {
    return (
      <section>
        <p className="text-sm text-red-600">{error || "Influencer not found."}</p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/admin/influencers"
            className="text-sm font-medium text-[#884F38] underline dark:text-[#D4B47A]"
          >
            Back to influencers
          </Link>
          <h1
            className="mt-3 text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {influencer.user.name ?? "Influencer"}
          </h1>
          <p className="mt-2 text-sm text-[#884F38] dark:text-[#8A7D75]">
            {influencer.user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={openPaymentModal}
          disabled={pendingBalance <= 0}
          className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#B87B68] dark:text-[#141210]"
        >
          Record Payment
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
          <h2
            className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Profile
          </h2>
          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[#8C7967] dark:text-[#8A7D75]">Name</p>
              <p className="mt-1 font-medium">{influencer.user.name ?? "Not set"}</p>
            </div>
            <div>
              <p className="text-[#8C7967] dark:text-[#8A7D75]">Phone</p>
              <p className="mt-1 font-medium">{influencer.user.phone ?? "Not set"}</p>
            </div>
            <div>
              <p className="text-[#8C7967] dark:text-[#8A7D75]">Referral Code</p>
              <p className="mt-1 font-mono text-lg font-semibold text-[#D4B47A]">
                {influencer.referralCode}
              </p>
            </div>
            <div>
              <p className="text-[#8C7967] dark:text-[#8A7D75]">Pending Balance</p>
              <p className="mt-1 font-semibold text-[#B87B68]">
                {formatBdt(pendingBalance)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
          <h2
            className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Settings
          </h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium">
              Commission Rate (%)
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={commissionRate}
                onChange={(event) => setCommissionRate(event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm outline-none focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814]"
              />
            </label>
            <label className="inline-flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={influencer.isActive}
                onChange={(event) => void handleActiveToggle(event.target.checked)}
                disabled={isSaving}
                className="h-4 w-4 accent-[#B87B68]"
              />
              Active influencer
            </label>
            <button
              type="button"
              onClick={() => void handleSaveSettings()}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2
            className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Referrals
          </h2>
          <p className="text-sm font-medium text-[#884F38]">
            Pending: {formatBdt(pendingReferralTotal)}
          </p>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Client</th>
                <th className="px-3 py-3 font-medium">Membership</th>
                <th className="px-3 py-3 font-medium">Original</th>
                <th className="px-3 py-3 font-medium">Discount</th>
                <th className="px-3 py-3 font-medium">Client Paid</th>
                <th className="px-3 py-3 font-medium">Commission</th>
                <th className="px-3 py-3 font-medium">Company Receives</th>
                <th className="px-3 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {influencer.referrals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-sm text-muted">
                    No referrals yet.
                  </td>
                </tr>
              ) : (
                influencer.referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-3 py-4">{formatDate(referral.createdAt)}</td>
                    <td className="px-3 py-4">
                      <div className="font-medium">{referral.client.name ?? "Client"}</div>
                      <div className="text-xs text-muted">{referral.client.email}</div>
                    </td>
                    <td className="px-3 py-4">
                      {referral.membership.tier}
                      <div className="text-xs text-muted">
                        {referral.membership.membershipId}
                      </div>
                    </td>
                    <td className="px-3 py-4">{formatBdt(referral.originalAmount)}</td>
                    <td className="px-3 py-4">{formatBdt(referral.discountAmount)}</td>
                    <td className="px-3 py-4">{formatBdt(referral.clientPaid)}</td>
                    <td className="px-3 py-4 font-semibold text-[#B87B68]">
                      {formatBdt(referral.commissionAmount)}
                    </td>
                    <td className="px-3 py-4">{formatBdt(referral.companyReceives)}</td>
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
      </section>

      <section className="rounded-lg border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
        <h2
          className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Payment History
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Amount</th>
                <th className="px-3 py-3 font-medium">Method</th>
                <th className="px-3 py-3 font-medium">Note</th>
                <th className="px-3 py-3 font-medium">Paid By</th>
              </tr>
            </thead>
            <tbody>
              {influencer.payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">
                    No payments recorded.
                  </td>
                </tr>
              ) : (
                influencer.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-3 py-4">{formatDate(payment.paidAt)}</td>
                    <td className="px-3 py-4 font-semibold text-[#B87B68]">
                      {formatBdt(payment.amount)}
                    </td>
                    <td className="px-3 py-4">{payment.method}</td>
                    <td className="px-3 py-4">{payment.note || "-"}</td>
                    <td className="px-3 py-4">{payment.paidBy || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isPaymentModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <form
            onSubmit={(event) => void handleRecordPayment(event)}
            className="w-full max-w-md rounded-lg border border-[#EADDCD] bg-white p-6 shadow-xl dark:border-[#3D3530] dark:bg-[#242220]"
          >
            <h2
              className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Record Payment
            </h2>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium">
                Amount
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm outline-none focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814]"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Method
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm outline-none focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814]"
                >
                  <option value="BKASH">bKash</option>
                  <option value="CASH">Cash</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Date
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm outline-none focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814]"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Note
                <textarea
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-md border border-[#EADDCD] bg-white px-3 py-2 text-sm outline-none focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814]"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isRecordingPayment}
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#EADDCD] px-4 text-sm font-medium disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRecordingPayment}
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] disabled:opacity-60"
              >
                {isRecordingPayment ? "Recording..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
