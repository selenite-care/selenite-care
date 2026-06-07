"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

type AdminBooking = {
  id: string;
  token?: string | null;
  appointmentTime: string;
  status: string;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
  };
  service: {
    name: string;
  };
  doctor: {
    name: string;
  } | null;
  payment: {
    amount: number;
    status: string;
  } | null;
};

const bookingStatuses = [
  "All",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof bookingStatuses)[number]>("All");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        const response = await fetch("/api/admin/bookings");

        if (!response.ok) {
          throw new Error("Unable to load bookings.");
        }

        const data = (await response.json()) as { bookings?: AdminBooking[] };
        setBookings(data.bookings ?? []);
      } catch {
        setError("Bookings are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      const bookingToken = booking.token ?? booking.id;
      const clientName = booking.user.name ?? booking.user.email;
      const matchesSearch =
        !normalizedQuery ||
        clientName.toLowerCase().includes(normalizedQuery) ||
        bookingToken.toLowerCase().includes(normalizedQuery) ||
        booking.service.name.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "All" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  function formatBdt(amount: number) {
    return `${Math.round(amount)} BDT`;
  }

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredBookings.map((booking) => ({
        "Booking Token": booking.token ?? booking.id,
        "Client Name": booking.user.name ?? booking.user.email,
        "Client Phone": booking.user.phone ?? "",
        "Service Name": booking.service.name,
        "Doctor Name": booking.doctor?.name ?? "",
        "Appointment Time": new Date(booking.appointmentTime).toLocaleString(),
        "Booking Status": booking.status,
        "Payment Status": booking.payment?.status ?? "UNPAID",
        Amount: booking.payment ? formatBdt(booking.payment.amount) : "",
      })),
      {
        columns: [
          "Booking Token",
          "Client Name",
          "Client Phone",
          "Service Name",
          "Doctor Name",
          "Appointment Time",
          "Booking Status",
          "Payment Status",
          "Amount",
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
    <section>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          All Bookings
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Review every consultation booking and its payment state.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-foreground/70">Loading bookings...</p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && bookings.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/70">
          No bookings found.
        </p>
      ) : null}

      {!isLoading && !error && bookings.length > 0 ? (
        <>
          <div className="mt-8 rounded-lg border border-[#D8C7B5] bg-white p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
              <div>
                <label
                  htmlFor="booking-search"
                  className="text-sm font-medium text-[#2B2B2B]"
                >
                  Search bookings
                </label>
                <input
                  id="booking-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Client name, booking token, or service name"
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-status-filter"
                  className="text-sm font-medium text-[#2B2B2B]"
                >
                  Status
                </label>
                <select
                  id="booking-status-filter"
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

          {filteredBookings.length === 0 ? (
            <p className="mt-8 text-sm text-foreground/70">
              No bookings match your filters.
            </p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3 font-medium">Booking Token</th>
                      <th className="px-4 py-3 font-medium">Client Name</th>
                      <th className="px-4 py-3 font-medium">Service Name</th>
                      <th className="px-4 py-3 font-medium">Appointment Time</th>
                      <th className="px-4 py-3 font-medium">Payment Status</th>
                      <th className="px-4 py-3 font-medium">Booking Status</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-black/10 last:border-0 dark:border-white/10"
                      >
                        <td className="px-4 py-4 font-mono text-xs text-foreground/70">
                          {booking.token ?? booking.id}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {booking.user.name ?? booking.user.email}
                        </td>
                        <td className="px-4 py-4 text-foreground/70">
                          {booking.service.name}
                        </td>
                        <td className="px-4 py-4 text-foreground/70">
                          {new Date(booking.appointmentTime).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-foreground/70">
                          {booking.payment?.status ?? "UNPAID"}
                        </td>
                        <td className="px-4 py-4 text-foreground/70">
                          {booking.status}
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
