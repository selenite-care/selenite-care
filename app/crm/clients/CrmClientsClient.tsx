"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

export type CrmClientListItem = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  memberships: Array<{
    id: string;
    tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
    status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
    createdAt: string;
  }>;
  _count: {
    bookings: number;
  };
};

type CrmClientsClientProps = {
  clients: CrmClientListItem[];
};

const MEMBERSHIP_FILTERS = [
  { value: "all", label: "All" },
  { value: "none", label: "No Membership" },
  { value: "pending", label: "Pending Verification" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTierLabel(tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM") {
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

function getMembershipStatusStyles(
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED",
) {
  switch (status) {
    case "ACTIVE":
      return {
        badge: "bg-emerald-100",
        text: "text-emerald-800",
      };
    case "PENDING":
      return {
        badge: "bg-amber-100",
        text: "text-amber-800",
      };
    case "CANCELLED":
      return {
        badge: "bg-red-100",
        text: "text-red-800",
      };
    case "EXPIRED":
    default:
      return {
        badge: "bg-zinc-200",
        text: "text-zinc-700",
      };
  }
}

export default function CrmClientsClient({ clients }: CrmClientsClientProps) {
  const [clientItems, setClientItems] = useState(clients);
  const [searchQuery, setSearchQuery] = useState("");
  const [membershipFilter, setMembershipFilter] =
    useState<(typeof MEMBERSHIP_FILTERS)[number]["value"]>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setClientItems(clients);
  }, [clients]);

  useEffect(() => {
    let isMounted = true;

    async function loadClients() {
      if (membershipFilter === "all") {
        if (isMounted) {
          setClientItems(clients);
          setError("");
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setIsLoading(true);
          setError("");
        }

        const searchParams = new URLSearchParams({
          membershipFilter,
        });
        const response = await fetch(`/api/crm/clients?${searchParams.toString()}`);

        if (!response.ok) {
          throw new Error("Unable to load clients.");
        }

        const data = (await response.json()) as {
          clients?: CrmClientListItem[];
        };

        if (isMounted) {
          setClientItems(data.clients ?? []);
        }
      } catch {
        if (isMounted) {
          setError("Clients are not available right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadClients();

    return () => {
      isMounted = false;
    };
  }, [clients, membershipFilter]);

  const filteredClients = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return clientItems;
    }

    return clientItems.filter(
      (client) =>
        (client.name ?? "").toLowerCase().includes(normalizedQuery) ||
        client.email.toLowerCase().includes(normalizedQuery) ||
        (client.phone ?? "").toLowerCase().includes(normalizedQuery),
    );
  }, [clientItems, searchQuery]);

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredClients.map((client) => ({
        Name: client.name ?? "",
        Email: client.email,
        Phone: client.phone ?? "",
        Membership: client.memberships[0]
          ? `${getTierLabel(client.memberships[0].tier)} (${client.memberships[0].status})`
          : "No Membership",
        "Registration Date": formatDate(client.createdAt),
        "Total Bookings": client._count.bookings,
      })),
      {
        columns: [
          "Name",
          "Email",
          "Phone",
          "Membership",
          "Registration Date",
          "Total Bookings",
        ],
      },
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "selenite-care-clients.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mb-6 rounded-3xl border border-[#D8C7B5] bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
          <div>
            <label
              htmlFor="crm-client-search"
              className="text-sm font-medium text-[#2B2B2B]"
            >
              Search clients
            </label>
            <input
              id="crm-client-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Name, email, or phone number"
              className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            />
          </div>

          <div>
            <label
              htmlFor="crm-membership-filter"
              className="text-sm font-medium text-[#2B2B2B]"
            >
              Membership Status
            </label>
            <select
              id="crm-membership-filter"
              value={membershipFilter}
              onChange={(event) =>
                setMembershipFilter(
                  event.target.value as (typeof MEMBERSHIP_FILTERS)[number]["value"],
                )
              }
              className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            >
              {MEMBERSHIP_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredClients.length === 0}
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
          Showing {filteredClients.length} of {clientItems.length} clients.
        </p>
      </div>

      {isLoading ? (
        <p className="mb-4 text-sm text-[#8C7967]">Loading clients...</p>
      ) : null}

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-background shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/10 text-left dark:divide-white/10">
            <thead className="bg-zinc-100 text-sm uppercase tracking-wide text-foreground/60 dark:bg-white/5">
              <tr>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Phone</th>
                <th className="px-4 py-4">Membership</th>
                <th className="px-4 py-4">Registered</th>
                <th className="px-4 py-4">Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 bg-white text-sm dark:divide-white/10 dark:bg-zinc-900">
              {filteredClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "#B8A89A" }}
                  >
                    No users match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const latestMembership = client.memberships[0];
                  const membershipStyles = latestMembership
                    ? getMembershipStatusStyles(latestMembership.status)
                    : {
                        badge: "bg-zinc-200",
                        text: "text-zinc-700",
                      };

                  return (
                    <tr key={client.id}>
                      <td className="px-4 py-4 font-medium text-foreground">
                        {client.name ?? "-"}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {client.email}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {client.phone ?? "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${membershipStyles.badge} ${membershipStyles.text}`}
                        >
                          {latestMembership
                            ? `${getTierLabel(latestMembership.tier)} • ${latestMembership.status}`
                            : "No Membership"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {formatDate(client.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {client._count.bookings}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="px-4 pb-4 text-xs text-foreground/60 md:hidden">
          Scroll to see more
        </p>
      </div>
    </>
  );
}
