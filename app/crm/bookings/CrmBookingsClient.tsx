"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useMemo, useState } from "react";

export type CrmBookingListItem = {
  id: string;
  token: string | null;
  appointmentTime: string | null;
  status: string;
  user: {
    name: string | null;
    phone: string | null;
  };
  service: {
    name: string;
  } | null;
  doctor: {
    name: string;
  } | null;
};

type CrmBookingsClientProps = {
  bookings: CrmBookingListItem[];
};

const bookingStatuses = [
  "All",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

function getBookingStatusBadgeClasses(status: string) {
  switch (status) {
    case "PENDING":
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-300";
    case "CONFIRMED":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300";
    case "COMPLETED":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300";
    default:
      return "border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5";
  }
}

function formatAppointmentTime(value: string | null) {
  if (!value || value === "Not scheduled") {
    return "Not scheduled";
  }

  return new Date(value).toLocaleDateString("en-US");
}

export default function CrmBookingsClient({ bookings }: CrmBookingsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof bookingStatuses)[number]>("All");

  const filteredBookings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      const bookingToken = booking.token ?? booking.id;
      const matchesSearch =
        !normalizedQuery ||
        (booking.user.name ?? "").toLowerCase().includes(normalizedQuery) ||
        (booking.user.phone ?? "").toLowerCase().includes(normalizedQuery) ||
        bookingToken.toLowerCase().includes(normalizedQuery) ||
        (booking.service?.name ?? "").toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "All" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredBookings.map((booking) => ({
        "Booking Token": booking.token ?? booking.id,
        "Client Name": booking.user.name ?? "",
        "Client Phone": booking.user.phone ?? "",
        "Service Name": booking.service?.name ?? "No service attached",
        "Doctor Name": booking.doctor?.name ?? "",
        "Preferred Date": formatAppointmentTime(booking.appointmentTime),
        "Booking Status": booking.status,
      })),
      {
        columns: [
          "Booking Token",
          "Client Name",
          "Client Phone",
          "Service Name",
          "Doctor Name",
          "Preferred Date",
          "Booking Status",
        ],
      },
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "selenite-care-bookings.csv";
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
              htmlFor="crm-booking-search"
              className="text-sm font-medium text-[#2B2B2B]"
            >
              Search bookings
            </label>
            <input
              id="crm-booking-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Client name, phone, booking token, or service name"
              className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            />
          </div>

          <div>
            <label
              htmlFor="crm-booking-status-filter"
              className="text-sm font-medium text-[#2B2B2B]"
            >
              Status
            </label>
            <select
              id="crm-booking-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as (typeof bookingStatuses)[number],
                )
              }
              className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            >
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredBookings.length === 0}
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
          Showing {filteredBookings.length} of {bookings.length} bookings.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-background shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/10 text-left dark:divide-white/10">
            <thead className="bg-zinc-100 text-sm uppercase tracking-wide text-foreground/60 dark:bg-white/5">
              <tr>
                <th className="px-4 py-4">Booking Token</th>
                <th className="px-4 py-4">Client Name</th>
                <th className="px-4 py-4">Client Phone</th>
                {/* <th className="px-4 py-4">Service</th> */}
                <th className="px-4 py-4">Doctor</th>
                <th className="px-4 py-4">Preferred Date</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 bg-white text-sm dark:divide-white/10 dark:bg-zinc-900">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-foreground/70">
                    No bookings match your filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-4 font-mono text-xs text-foreground">
                      <Link
                        href={`/crm/bookings/${booking.id}`}
                        className="transition-colors hover:text-foreground/70"
                      >
                        {booking.token ?? booking.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4 font-medium text-foreground">
                      {booking.user.name ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      {booking.user.phone ?? "-"}
                    </td>
                    {/* <td className="px-4 py-4 text-foreground/70">
                      {booking.service?.name ?? "No service attached"}
                    </td> */}
                    <td className="px-4 py-4 text-foreground/70">
                      {booking.doctor?.name ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      {formatAppointmentTime(booking.appointmentTime)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getBookingStatusBadgeClasses(
                          booking.status,
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/crm/bookings/${booking.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-black/10 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
