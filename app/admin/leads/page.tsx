"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/dateUtils";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  interest: string | null;
  createdAt: string;
};

type LeadQuality = "LIKELY_REAL" | "REVIEW" | "SPAM";
type LeadWithQuality = Lead & {
  quality: LeadQuality;
};

const QUALITY_LABELS: Record<LeadQuality, string> = {
  LIKELY_REAL: "Likely Real",
  REVIEW: "Review",
  SPAM: "Likely Spam",
};

const TRUSTED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
]);

function hasVowels(value: string) {
  return /[aeiouAEIOU]/.test(value);
}

function hasSuspiciousDotPattern(email: string) {
  const [localPart = ""] = email.toLowerCase().split("@");
  return /(?:^|\.)(?:[a-z0-9]\.){2,}[a-z0-9](?:\.|$)/i.test(localPart);
}

function getEmailDomain(email: string | null) {
  return email?.split("@")[1]?.toLowerCase().trim() ?? "";
}

function isBangladeshiPhone(phone: string) {
  const normalized = phone.trim();
  return normalized.startsWith("+880") || normalized.startsWith("01");
}

function isTenDigitsWithoutCountryCode(phone: string) {
  return /^\d{10}$/.test(phone.trim());
}

function getLeadQuality(lead: Lead): LeadQuality {
  const email = lead.email?.trim() ?? "";
  const emailHasSuspiciousDots = email ? hasSuspiciousDotPattern(email) : false;

  if (
    isTenDigitsWithoutCountryCode(lead.phone) ||
    !hasVowels(lead.name) ||
    emailHasSuspiciousDots
  ) {
    return "SPAM";
  }

  const trustedEmail =
    email &&
    TRUSTED_EMAIL_DOMAINS.has(getEmailDomain(email)) &&
    !emailHasSuspiciousDots;

  if (isBangladeshiPhone(lead.phone) && /\s/.test(lead.name) && trustedEmail) {
    return "LIKELY_REAL";
  }

  return "REVIEW";
}

function getQualityBadgeClasses(quality: LeadQuality) {
  switch (quality) {
    case "LIKELY_REAL":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300";
    case "SPAM":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300";
    default:
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-300";
  }
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [qualityFilter, setQualityFilter] = useState<"ALL" | LeadQuality>("ALL");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingSpam, setIsDeletingSpam] = useState(false);
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

  const leadsWithQuality = useMemo<LeadWithQuality[]>(
    () =>
      leads.map((lead) => ({
        ...lead,
        quality: getLeadQuality(lead),
      })),
    [leads],
  );

  const filteredLeads = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return leadsWithQuality.filter((lead) => {
      const matchesQuality =
        qualityFilter === "ALL" || lead.quality === qualityFilter;

      if (!matchesQuality) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        lead.name.toLowerCase().includes(normalizedQuery) ||
        lead.phone.toLowerCase().includes(normalizedQuery) ||
        (lead.email ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [leadsWithQuality, qualityFilter, searchQuery]);

  const spamLeads = useMemo(
    () => leadsWithQuality.filter((lead) => lead.quality === "SPAM"),
    [leadsWithQuality],
  );

  async function handleCopyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      toast.success("Phone number copied.");
    } catch {
      setError("Unable to copy the phone number right now.");
      toast.error("Unable to copy the phone number right now.");
    }
  }

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredLeads.map((lead) => ({
        Name: lead.name,
        Phone: lead.phone,
        Email: lead.email ?? "",
        Interest: lead.interest ?? "",
        Quality: QUALITY_LABELS[lead.quality],
        "Date Submitted": formatDateTime(lead.createdAt),
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

  async function handleDeleteSpam() {
    if (spamLeads.length === 0 || isDeletingSpam) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${spamLeads.length} lead${spamLeads.length === 1 ? "" : "s"} marked as likely spam? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingSpam(true);
    setError("");

    try {
      const response = await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: spamLeads.map((lead) => lead.id),
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { deletedCount?: number; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to delete spam leads.");
      }

      const deletedIds = new Set(spamLeads.map((lead) => lead.id));
      setLeads((current) => current.filter((lead) => !deletedIds.has(lead.id)));
      toast.success(`Deleted ${data?.deletedCount ?? spamLeads.length} spam leads.`);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete spam leads.";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeletingSpam(false);
    }
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
        <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
          Review landing page lead submissions and follow up with interested clients.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-[#884F38] dark:text-[#8A7D75]">
          Loading leads...
        </p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error ? (
        <>
          <div className="mt-8 rounded-lg border border-[#EADDCD] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220]">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto] lg:items-end">
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
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#884F38] focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
                />
              </div>

              <div>
                <label
                  htmlFor="leads-quality"
                  className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  Quality
                </label>
                <select
                  id="leads-quality"
                  value={qualityFilter}
                  onChange={(event) =>
                    setQualityFilter(event.target.value as "ALL" | LeadQuality)
                  }
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                >
                  <option value="ALL">All Leads</option>
                  <option value="LIKELY_REAL">Likely Real</option>
                  <option value="REVIEW">Review</option>
                  <option value="SPAM">Spam</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredLeads.length === 0}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
              >
                Export CSV
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteSpam()}
                disabled={spamLeads.length === 0 || isDeletingSpam}
                className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 bg-red-50 px-5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                {isDeletingSpam ? "Deleting..." : `Delete Spam (${spamLeads.length})`}
              </button>
            </div>

            <p className="mt-4 text-sm text-[#884F38] dark:text-[#8A7D75]">
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
                    <th className="px-4 py-3 font-medium">Quality</th>
                    <th className="px-4 py-3 font-medium">Date Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="cell-muted px-4 py-8 text-center text-sm">
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
                              className="inline-flex h-8 items-center justify-center rounded-md border border-[#EADDCD] bg-white px-3 text-xs font-medium text-[#2B2B2B] transition-colors hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
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
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getQualityBadgeClasses(
                              lead.quality,
                            )}`}
                          >
                            {QUALITY_LABELS[lead.quality]}
                          </span>
                        </td>
                        <td className="cell-muted px-4 py-4">
                          {formatDateTime(lead.createdAt)}
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
