"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatDateOnly } from "@/lib/dateUtils";

type AdminBooking = {
  id: string;
  token?: string | null;
  appointmentTime: string | null;
  status: string;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
  };
  service: {
    name: string;
  } | null;
  doctor: {
    name: string;
  } | null;
};

type AdminBookingsResponse = {
  bookings?: AdminBooking[];
  totalCount?: number;
};

const bookingStatuses = [
  "All",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;
const ITEMS_PER_PAGE = 20;

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof bookingStatuses)[number]>("All");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    async function loadBookings() {
      try {
        setError("");
        setIsLoading(true);

        const searchParams = new URLSearchParams();
        searchParams.set("page", String(currentPage));
        searchParams.set("limit", String(ITEMS_PER_PAGE));
        if (searchQuery.trim()) {
          searchParams.set("search", searchQuery.trim());
        }
        if (statusFilter !== "All") {
          searchParams.set("statusFilter", statusFilter);
        }

        const response = await fetch(`/api/admin/bookings?${searchParams.toString()}`);

        if (!response.ok) {
          throw new Error("Unable to load bookings.");
        }

        const data = (await response.json()) as AdminBookingsResponse;
        setBookings(data.bookings ?? []);
        setTotalCount(data.totalCount ?? 0);
      } catch {
        setError("Bookings are not available right now.");
        setBookings([]);
        setTotalCount(0);
      } finally {
        setHasLoaded(true);
        setIsLoading(false);
      }
    }

    loadBookings();
  }, [currentPage, searchQuery, statusFilter]);

  const filteredBookings = bookings;
  const isInitialLoading = isLoading && !hasLoaded;

  function formatAppointmentTime(value: string | null) {
    return value ? formatDateOnly(value) : "Not scheduled";
  }

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredBookings.map((booking) => ({
        "Booking Token": booking.token ?? booking.id,
        "Client Name": booking.user.name ?? booking.user.email,
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
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{
            fontFamily: "Playfair Display, serif",
          }}>
          All Bookings
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
          Review every consultation booking and its current appointment status.
        </p>
      </div>

      {isInitialLoading ? (
        <div className="mt-8">
          <SkeletonTable rows={6} cols={5} />
        </div>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isInitialLoading && !error ? (
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
              Showing {filteredBookings.length} of {totalCount} bookings.
            </p>
            {isLoading ? (
              <p className="mt-2 text-xs text-[#B8A89A]">
                Updating results...
              </p>
            ) : null}
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-themed bg-card">
            <div className="overflow-x-auto">
              <table className="table-themed w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-medium">Booking Token</th>
                    <th className="px-4 py-3 font-medium">Client Name</th>
                    {/* <th className="px-4 py-3 font-medium">Service Name</th> */}
                    <th className="px-4 py-3 font-medium">Preferred Date</th>
                    <th className="px-4 py-3 font-medium">Booking Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="cell-muted px-4 py-8 text-center text-sm"
                      >
                        No bookings match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="cell-muted px-4 py-4 font-mono text-xs">
                          {booking.token ?? booking.id}
                        </td>
                        <td className="px-4 py-4">
                          {booking.user.name ?? booking.user.email}
                        </td>
                        {/* <td className="cell-muted px-4 py-4">
                          {booking.service?.name ?? "No service attached"}
                        </td> */}
                        <td className="cell-muted px-4 py-4">
                          {formatAppointmentTime(booking.appointmentTime)}
                        </td>
                        <td className="cell-muted px-4 py-4">
                          {booking.status}
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-themed px-3 text-sm font-medium text-page transition-colors hover:bg-black/5 dark:hover:bg-white/5"
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
            <p className="px-4 pb-4 text-xs text-muted md:hidden">
              Scroll to see more
            </p>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      ) : null}
    </section>
  );
}
