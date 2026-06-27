"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/dateUtils";

type PendingMembership = {
  id: string;
  membershipId: string;
  tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  payment: {
    id: string;
    amount: number;
    status: "UNPAID" | "PAID" | "REFUNDED";
    paymentMethod: "BKASH" | "BANK_TRANSFER" | "STRIPE";
    bkashTrxId: string | null;
    bankTransactionRef: string | null;
    bankTransferProof: string | null;
    createdAt: string;
  } | null;
};

type PendingMembershipResponse = {
  memberships?: PendingMembership[];
  error?: string;
};

type PendingPaymentMethod = "BKASH" | "BANK_TRANSFER" | "STRIPE";

function getTierBadgeStyles(tier: PendingMembership["tier"]) {
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

function getPaymentMethodBadgeStyles(
  paymentMethod: PendingPaymentMethod,
) {
  switch (paymentMethod) {
    case "BKASH":
      return {
        backgroundColor: "rgba(227, 30, 131, 0.12)",
        color: "#A80F5C",
      };
    case "BANK_TRANSFER":
      return {
        backgroundColor: "rgba(29, 95, 137, 0.12)",
        color: "#1D5F89",
      };
    default:
      return {
        backgroundColor: "rgba(107, 114, 128, 0.16)",
        color: "#4B5563",
      };
  }
}

function formatTierLabel(tier: PendingMembership["tier"]) {
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

function formatPaymentMethod(
  paymentMethod: PendingPaymentMethod,
) {
  switch (paymentMethod) {
    case "BKASH":
      return "bKash";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    default:
      return paymentMethod;
  }
}

function parseTransactionDetails(reference: string | null) {
  if (!reference) {
    return { transactionRef: "-", senderNumber: "" };
  }

  const parts = reference.split("|").map((part) => part.trim());
  const transactionRef =
    parts.find((part) => part.toLowerCase().startsWith("trxid:"))?.split(":")[1]?.trim() ??
    reference;
  const senderNumber =
    parts.find((part) => part.toLowerCase().startsWith("sender:"))?.split(":")[1]?.trim() ??
    "";

  return { transactionRef, senderNumber };
}

export default function AdminPendingMembershipsPage() {
  const [memberships, setMemberships] = useState<PendingMembership[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    async function loadPendingMemberships() {
      try {
        const response = await fetch("/api/admin/memberships/pending", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | PendingMembershipResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load pending memberships.");
        }

        setMemberships(data?.memberships ?? []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Pending memberships are not available right now.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadPendingMemberships();
  }, []);

  const pendingMemberships = useMemo(
    () => memberships.filter((membership) => membership.status === "PENDING"),
    [memberships],
  );

  const pendingMembershipGroups = useMemo(() => {
    const groups = new Map<string, PendingMembership[]>();

    for (const membership of pendingMemberships) {
      const existingGroup = groups.get(membership.user.id);

      if (existingGroup) {
        existingGroup.push(membership);
      } else {
        groups.set(membership.user.id, [membership]);
      }
    }

    return Array.from(groups.values());
  }, [pendingMemberships]);

  async function handleVerify(membershipId: string) {
    setUpdatingId(membershipId);
    setError("");

    try {
      const response = await fetch(`/api/admin/memberships/${membershipId}/verify`, {
        method: "PATCH",
      });
      const data = (await response.json().catch(() => null)) as
        | { membership?: PendingMembership; error?: string }
        | null;

      if (!response.ok || !data?.membership) {
        throw new Error(data?.error ?? "Unable to verify membership.");
      }

      setMemberships((current) =>
        current.filter((membership) => membership.id !== membershipId),
      );
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "Unable to verify membership.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleReject(membershipId: string) {
    const reason = rejectionReasons[membershipId]?.trim() ?? "";

    if (!reason) {
      setError("Please provide a rejection reason before rejecting.");
      return;
    }

    setRejectingId(membershipId);
    setError("");

    try {
      const response = await fetch(`/api/admin/memberships/${membershipId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });
      const data = (await response.json().catch(() => null)) as
        | { membership?: PendingMembership; error?: string }
        | null;

      if (!response.ok || !data?.membership) {
        throw new Error(data?.error ?? "Unable to reject membership.");
      }

      setMemberships((current) =>
        current.filter((membership) => membership.id !== membershipId),
      );
      setRejectionReasons((current) => {
        const next = { ...current };
        delete next[membershipId];
        return next;
      });
    } catch (rejectError) {
      setError(
        rejectError instanceof Error
          ? rejectError.message
          : "Unable to reject membership.",
      );
    } finally {
      setRejectingId(null);
    }
  }

  return (
    <section>
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{
            fontFamily: "Playfair Display, serif",
          }}
        >
          Pending Membership Verifications
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
          Review manually submitted membership payments and either verify or reject them.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
          Loading pending memberships...
        </p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && pendingMemberships.length === 0 ? (
        <p className="mt-8 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
          No pending membership verifications found.
        </p>
      ) : null}

      {!isLoading && pendingMemberships.length > 0 ? (
        <div className="mt-8 grid gap-6">
          {pendingMembershipGroups.map((group) => (
            <div key={group[0].user.id} className="grid gap-4">
              {group.length > 1 ? (
                <div className="rounded-2xl border border-yellow-300 bg-yellow-50 px-5 py-4 text-sm text-yellow-900 dark:border-yellow-700/60 dark:bg-yellow-950/25 dark:text-yellow-200">
                  This client has {group.length} pending submissions. Only verify one and reject the others.
                </div>
              ) : null}

              {group.map((membership) => {
                const transactionDetails = parseTransactionDetails(
                  membership.payment?.bankTransactionRef ?? membership.payment?.bkashTrxId ?? null,
                );
                const paymentMethod =
                  membership.payment?.paymentMethod ?? "BANK_TRANSFER";
                const isVerifying = updatingId === membership.id;
                const isRejecting = rejectingId === membership.id;

                return (
                  <article
                    key={membership.id}
                    className="rounded-2xl border border-[#D8C7B5] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-mono text-xs text-[#8C7967]">
                          {membership.membershipId}
                        </p>
                        <h2
                          className="mt-2 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                          style={{
                            fontFamily: "Playfair Display, serif",
                          }}
                        >
                          {membership.user.name ?? membership.user.email}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                            style={getTierBadgeStyles(membership.tier)}
                          >
                            {formatTierLabel(membership.tier)}
                          </span>
                          {membership.payment ? (
                            <span
                              className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                              style={getPaymentMethodBadgeStyles(paymentMethod)}
                            >
                              {formatPaymentMethod(paymentMethod)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {membership.payment?.bankTransferProof ? (
                        <a
                          href={membership.payment.bankTransferProof}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full max-w-[180px] overflow-hidden rounded-2xl border border-[#D8C7B5] bg-[#F8F5F0] p-2 dark:border-[#3D3530] dark:bg-[#2A2724]"
                        >
                          <img
                            src={membership.payment.bankTransferProof}
                            alt="Payment proof thumbnail"
                            className="h-32 w-full rounded-xl object-cover"
                          />
                        </a>
                      ) : (
                        <div
                          className="flex h-36 w-full max-w-[180px] items-center justify-center rounded-2xl border border-[#D8C7B5] bg-[#FCFAF7] px-4 text-center text-sm text-[#B8A89A] dark:border-[#3D3530] dark:bg-[#2A2724] dark:text-[#8A7D75]"
                        >
                          No proof image provided
                        </div>
                      )}
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967]">
                          Phone
                        </p>
                        <p className="mt-2 text-sm text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {membership.user.phone ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967]">
                          Email
                        </p>
                        <p className="mt-2 break-all text-sm text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {membership.user.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967]">
                          Amount
                        </p>
                        <p className="mt-2 text-sm text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {membership.payment
                            ? `${Math.round(membership.payment.amount)} BDT`
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967]">
                          Submitted
                        </p>
                        <p className="mt-2 text-sm text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {formatDateTime(membership.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967]">
                          Transaction Reference
                        </p>
                        <p className="mt-2 text-sm text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {transactionDetails.transactionRef}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967]">
                          Sender Number
                        </p>
                        <p className="mt-2 text-sm text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {transactionDetails.senderNumber || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-[#D8C7B5] bg-[#FCFAF7] p-4 dark:border-[#3D3530] dark:bg-[#2A2724]">
                      <label
                        htmlFor={`reject-reason-${membership.id}`}
                        className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                      >
                        Rejection reason
                      </label>
                      <textarea
                        id={`reject-reason-${membership.id}`}
                        value={rejectionReasons[membership.id] ?? ""}
                        onChange={(event) =>
                          setRejectionReasons((current) => ({
                            ...current,
                            [membership.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Explain why this payment is being rejected."
                        className="mt-3 w-full rounded-xl border border-[#D8C7B5] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
                      />
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => void handleVerify(membership.id)}
                        disabled={isVerifying || isRejecting}
                        className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#C6A56B] dark:text-[#141210]"
                      >
                        {isVerifying ? "Verifying..." : "Verify & Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReject(membership.id)}
                        disabled={isVerifying || isRejecting}
                        className="inline-flex h-11 items-center justify-center rounded-md border border-[#C84B4B] bg-white px-5 text-sm font-medium text-[#B91C1C] transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#242220]"
                      >
                        {isRejecting ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
