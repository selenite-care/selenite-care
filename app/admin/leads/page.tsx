"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  interest: string | null;
  createdAt: string;
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLeads() {
      try {
        const response = await fetch("/api/admin/leads", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | { leads?: Lead[]; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load leads.");
        }

        if (!isMounted) {
          return;
        }

        setLeads(data?.leads ?? []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "Unable to load leads.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLeads();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!copiedPhone) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedPhone(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedPhone]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return leads;
    }

    return leads.filter((lead) => {
      return (
        lead.name.toLowerCase().includes(normalizedQuery) ||
        lead.phone.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [leads, searchQuery]);

  async function handleCopyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
    } catch {
      setError("Unable to copy the phone number right now.");
    }
  }

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredLeads.map((lead) => ({
        Name: lead.name,
        Phone: lead.phone,
        Email: lead.email ?? "",
        Interest: lead.interest ?? "",
        "Date Submitted": new Date(lead.createdAt).toLocaleString(),
      })),
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "selenite-care-leads.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Leads
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
          Review landing page lead submissions and follow up with interested clients.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
          Loading leads...
        </p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error ? (
        <>
          <div className="mt-8 rounded-lg border border-[#D8C7B5] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220]">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <label
                  htmlFor="leads-search"
                  className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  Search Leads
                </label>
                <input
                  id="leads-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name or phone"
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
                />
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredLeads.length === 0}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#B8A89A] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
              >
                Export CSV
              </button>
            </div>

            <p className="mt-4 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
              Showing {filteredLeads.length} of {leads.length} leads.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-themed bg-card">
            <div className="overflow-x-auto">
              <table className="table-themed w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Interest</th>
                    <th className="px-4 py-3 font-medium">Date Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="cell-muted px-4 py-8 text-center text-sm">
                        No leads match the current search.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="cell-page px-4 py-4 font-medium">
                          {lead.name}
                        </td>
                        <td className="cell-muted px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span>{lead.phone}</span>
                            <button
                              type="button"
                              onClick={() => void handleCopyPhone(lead.phone)}
                              className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8C7B5] bg-white px-3 text-xs font-medium text-[#2B2B2B] transition-colors hover:bg-[#C6A56B]/10 dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                            >
                              {copiedPhone === lead.phone ? "Copied" : "Copy"}
                            </button>
                          </div>
                        </td>
                        <td className="cell-muted px-4 py-4">
                          {lead.email ?? "Not provided"}
                        </td>
                        <td className="cell-muted px-4 py-4">
                          {lead.interest ?? "Not specified"}
                        </td>
                        <td className="cell-muted px-4 py-4">
                          {new Date(lead.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
