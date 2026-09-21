"use client";

import Link from "next/link";
import { Copy, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatDateOnly } from "@/lib/dateUtils";

type Consultation = {
  id: string;
  createdAt: string;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  followUpUsed: boolean;
  booking: {
    id: string;
    token: string;
    doctorId: string | null;
    appointmentTime: string | null;
    doctor: { name: string } | null;
    user: {
      name: string | null;
      phone: string | null;
      email: string;
    };
  };
};

type ConsultationsResponse = {
  consultations?: Consultation[];
  todayCount?: number;
  error?: string;
};

const FILTERS = [
  "All",
  "Paid",
  "Unpaid",
  "Follow-up Used",
  "Follow-up Available",
] as const;

type Filter = (typeof FILTERS)[number];

function csvEscape(value: string | number | null | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function paymentBadgeClasses(status: Consultation["paymentStatus"]) {
  if (status === "PAID") {
    return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300";
  }

  if (status === "REFUNDED") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300";
}

type OneTimeConsultationsPageProps = {
  apiPath: string;
  bookingBasePath: string;
  followUpEndpointBase?: string;
};

export default function OneTimeConsultationsPage({
  apiPath,
  bookingBasePath,
  followUpEndpointBase,
}: OneTimeConsultationsPageProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [copiedPhone, setCopiedPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingConsultationId, setUpdatingConsultationId] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadConsultations() {
      try {
        setError("");
        const response = await fetch(apiPath, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => null)) as
          | ConsultationsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load consultations.");
        }

        setConsultations(data?.consultations ?? []);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load consultations.",
        );
        setConsultations([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadConsultations();
    return () => controller.abort();
  }, [apiPath]);

  const filteredConsultations = useMemo(() => {
    return consultations.filter((consultation) => {
      switch (filter) {
        case "Paid":
          return consultation.paymentStatus === "PAID";
        case "Unpaid":
          return consultation.paymentStatus === "UNPAID";
        case "Follow-up Used":
          return consultation.followUpUsed;
        case "Follow-up Available":
          return !consultation.followUpUsed;
        default:
          return true;
      }
    });
  }, [consultations, filter]);

  async function copyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      window.setTimeout(() => setCopiedPhone(""), 1600);
    } catch {
      setCopiedPhone("");
    }
  }

  async function markFollowUpUsed(consultationId: string) {
    if (!followUpEndpointBase || updatingConsultationId) return;

    setActionError("");
    setUpdatingConsultationId(consultationId);

    try {
      const response = await fetch(
        `${followUpEndpointBase}/${consultationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ followUpUsed: true }),
        },
      );
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to update follow-up status.");
      }

      setConsultations((current) =>
        current.map((consultation) =>
          consultation.id === consultationId
            ? { ...consultation, followUpUsed: true }
            : consultation,
        ),
      );
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update follow-up status.",
      );
    } finally {
      setUpdatingConsultationId("");
    }
  }

  function exportCsv() {
    const headers = [
      "Client Name",
      "Phone",
      "Email",
      "Preferred Date",
      "Doctor",
      "Doctor ID",
      "Booking Token",
      "Payment Status",
      "Follow-up Used",
    ];
    const rows = filteredConsultations.map((consultation) => [
      consultation.booking.user.name ?? "N/A",
      consultation.booking.user.phone ?? "",
      consultation.booking.user.email,
      formatDateOnly(consultation.booking.appointmentTime),
      consultation.booking.doctor?.name ?? "Unassigned",
      consultation.booking.doctorId ?? "",
      consultation.booking.token,
      consultation.paymentStatus,
      consultation.followUpUsed ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "one-time-consultations.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          One-Time Consultations
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Review paid and pending direct consultation bookings.
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-[#B87B68] bg-[#FFF8E6] p-5 text-[#2B2B2B] dark:bg-[#33291C] dark:text-[#F0EDE8]">
        <p className="font-semibold">
          Call each client to confirm consultation time!
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-lg border border-black/10 bg-background p-4 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
        <label className="w-full sm:max-w-xs">
          <span className="text-sm font-medium text-foreground">Filter</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
            className="mt-2 h-11 w-full rounded-md border border-black/10 bg-background px-3 text-sm text-foreground outline-none focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-white/10"
          >
            {FILTERS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={exportCsv}
          disabled={filteredConsultations.length === 0}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      <p className="mt-4 text-sm text-foreground/70">
        Showing {filteredConsultations.length} of {consultations.length} bookings.
      </p>

      {actionError ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {actionError}
        </p>
      ) : null}

      {isLoading ? (
        <div className="mt-6">
          <SkeletonTable rows={6} cols={9} />
        </div>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!isLoading && !error ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Client Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Preferred Date</th>
                  <th className="px-4 py-3 font-medium">Doctor Name</th>
                  <th className="px-4 py-3 font-medium">Booking Token</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Follow-up</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsultations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-foreground/70">
                      No consultations match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredConsultations.map((consultation) => (
                    <tr
                      key={consultation.id}
                      className="border-b border-black/10 last:border-0 dark:border-white/10"
                    >
                      <td className="px-4 py-4 font-medium text-foreground">
                        {consultation.booking.user.name ?? "N/A"}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {consultation.booking.user.phone ? (
                          <div className="flex items-center gap-2">
                            <span>{consultation.booking.user.phone}</span>
                            <button
                              type="button"
                              onClick={() =>
                                void copyPhone(consultation.booking.user.phone ?? "")
                              }
                              className="inline-flex h-8 items-center gap-1 rounded-md border border-black/10 px-2 text-xs font-medium text-foreground hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                              aria-label={`Copy phone number for ${consultation.booking.user.name ?? "client"}`}
                            >
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              {copiedPhone === consultation.booking.user.phone
                                ? "Copied"
                                : "Copy"}
                            </button>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {consultation.booking.user.email}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {formatDateOnly(consultation.booking.appointmentTime)}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {consultation.booking.doctor?.name ?? "Unassigned"}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-foreground/70">
                        {consultation.booking.token}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${paymentBadgeClasses(consultation.paymentStatus)}`}
                        >
                          {consultation.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            consultation.followUpUsed
                              ? "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                              : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300"
                          }`}
                        >
                          {consultation.followUpUsed ? "Used" : "Available"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {followUpEndpointBase &&
                          consultation.paymentStatus === "PAID" &&
                          !consultation.followUpUsed ? (
                            <button
                              type="button"
                              onClick={() =>
                                void markFollowUpUsed(consultation.id)
                              }
                              disabled={Boolean(updatingConsultationId)}
                              className="inline-flex h-9 items-center justify-center rounded-md bg-[#B87B68] px-3 text-sm font-medium text-[#211E1A] transition-colors hover:bg-[#C9907D] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {updatingConsultationId === consultation.id
                                ? "Updating..."
                                : "Mark Follow-up Used"}
                            </button>
                          ) : null}
                          <Link
                            href={`${bookingBasePath}/${consultation.booking.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                          >
                            View Booking
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

