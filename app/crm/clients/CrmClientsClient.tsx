"use client";

import Papa from "papaparse";
import { useMemo, useState } from "react";

export type CrmClientListItem = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  _count: {
    bookings: number;
  };
};

type CrmClientsClientProps = {
  clients: CrmClientListItem[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CrmClientsClient({ clients }: CrmClientsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return clients;
    }

    return clients.filter(
      (client) =>
        (client.name ?? "").toLowerCase().includes(normalizedQuery) ||
        client.email.toLowerCase().includes(normalizedQuery) ||
        (client.phone ?? "").toLowerCase().includes(normalizedQuery),
    );
  }, [clients, searchQuery]);

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredClients.map((client) => ({
        Name: client.name ?? "",
        Email: client.email,
        Phone: client.phone ?? "",
        "Registration Date": formatDate(client.createdAt),
        "Total Bookings": client._count.bookings,
      })),
      {
        columns: [
          "Name",
          "Email",
          "Phone",
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
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
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
          Showing {filteredClients.length} of {clients.length} clients.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-background shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <table className="min-w-full divide-y divide-black/10 text-left dark:divide-white/10">
          <thead className="bg-zinc-100 text-sm uppercase tracking-wide text-foreground/60 dark:bg-white/5">
            <tr>
              <th className="px-4 py-4">Name</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">Phone</th>
              <th className="px-4 py-4">Registered</th>
              <th className="px-4 py-4">Bookings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 bg-white text-sm dark:divide-white/10 dark:bg-zinc-900">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground/70">
                  No clients match your search.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
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
                  <td className="px-4 py-4 text-foreground/70">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-foreground/70">
                    {client._count.bookings}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
