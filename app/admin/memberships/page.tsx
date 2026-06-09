"use client";

import { useEffect, useMemo, useState } from "react";

type AdminMembership = {
  id: string;
  membershipId: string;
  tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
  };
  payment: {
    id: string;
    status: "UNPAID" | "PAID" | "REFUNDED";
  } | null;
};

type MembershipResponse = {
  memberships?: AdminMembership[];
  error?: string;
};

function getTierBadgeStyles(tier: AdminMembership["tier"]) {
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

function getStatusBadgeStyles(status: AdminMembership["status"]) {
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

function getPaymentBadgeStyles(status: "UNPAID" | "PAID" | "REFUNDED" | "N/A") {
  switch (status) {
    case "PAID":
      return {
        backgroundColor: "rgba(34, 197, 94, 0.12)",
        color: "#166534",
      };
    case "UNPAID":
      return {
        backgroundColor: "rgba(198, 165, 107, 0.14)",
        color: "#8A6A2F",
      };
    case "REFUNDED":
      return {
        backgroundColor: "rgba(107, 114, 128, 0.16)",
        color: "#4B5563",
      };
    case "N/A":
      return {
        backgroundColor: "rgba(107, 114, 128, 0.16)",
        color: "#4B5563",
      };
  }
}

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<AdminMembership[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMemberships() {
      try {
        const response = await fetch("/api/admin/memberships");
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

  async function updateMembershipStatus(
    membershipId: string,
    status: "ACTIVE" | "CANCELLED",
  ) {
    setUpdatingId(membershipId);
    setError("");

    try {
      const response = await fetch(`/api/admin/memberships/${membershipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => null)) as
        | { membership?: AdminMembership; error?: string }
        | null;

      if (!response.ok || !data?.membership) {
        throw new Error(data?.error ?? "Unable to update membership.");
      }

      setMemberships((current) =>
        current.map((membership) =>
          membership.id === membershipId ? data.membership! : membership,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update membership.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const hasMemberships = useMemo(() => memberships.length > 0, [memberships]);

  return (
    <section>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Memberships
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Review membership purchases and manage activation status.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-foreground/70">Loading memberships...</p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && !hasMemberships ? (
        <p className="mt-8 text-sm text-foreground/70">No memberships found.</p>
      ) : null}

      {!isLoading && hasMemberships ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Membership ID</th>
                  <th className="px-4 py-3 font-medium">Client Name</th>
                  <th className="px-4 py-3 font-medium">Client Phone</th>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment Status</th>
                  <th className="px-4 py-3 font-medium">Purchase Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((membership) => {
                  const paymentStatus = membership.payment?.status ?? "N/A";
                  const isUpdating = updatingId === membership.id;

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
                        <span
                          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                          style={getPaymentBadgeStyles(paymentStatus)}
                        >
                          {paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {new Date(membership.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateMembershipStatus(membership.id, "ACTIVE")
                            }
                            disabled={isUpdating || membership.status === "ACTIVE"}
                            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            style={{
                              backgroundColor: "#2B2B2B",
                              color: "#F8F5F0",
                            }}
                          >
                            {isUpdating && membership.status !== "ACTIVE"
                              ? "Updating..."
                              : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateMembershipStatus(membership.id, "CANCELLED")
                            }
                            disabled={
                              isUpdating || membership.status === "CANCELLED"
                            }
                            className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            style={{
                              borderColor: "#C6A56B",
                              color: "#2B2B2B",
                              backgroundColor: "#FFFFFF",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
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
