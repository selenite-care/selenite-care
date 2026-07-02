"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatDateOnly } from "@/lib/dateUtils";

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
  bookings?: CrmBookingListItem[];
};

type CrmBookingsResponse = {
  bookings?: CrmBookingListItem[];
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

  return formatDateOnly(value);
}

export default function CrmBookingsClient({ bookings }: CrmBookingsClientProps) {
  const [bookingItems, setBookingItems] = useState(bookings ?? []);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof bookingStatuses)[number]>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    let isMounted = true;

    async function loadBookings() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError("");
        }

        const searchParams = new URLSearchParams();
        searchParams.set("page", String(currentPage));
        searchParams.set("limit", String(ITEMS_PER_PAGE));
        if (searchQuery.trim()) {
          searchParams.set("search", searchQuery.trim());
        }
        if (statusFilter !== "All") {
          searchParams.set("statusFilter", statusFilter);
        }

        const response = await fetch(`/api/crm/bookings?${searchParams.toString()}`);

        if (!response.ok) {
          throw new Error("Unable to load bookings.");
        }

        const data = (await response.json()) as CrmBookingsResponse;

        if (isMounted) {
          setBookingItems(data.bookings ?? []);
          setTotalCount(data.totalCount ?? 0);
        }
      } catch {
        if (isMounted) {
          setError("Bookings are not available right now.");
          setBookingItems([]);
          setTotalCount(0);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, [currentPage, searchQuery, statusFilter]);

  const filteredBookings = bookingItems;

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
      <div className="mb-6 rounded-3xl border border-[#EADDCD] bg-white p-5 shadow-sm">
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
              className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#884F38] focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68]"
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
              className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68]"
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

        <p className="mt-4 text-sm text-[#884F38]">
          Showing {filteredBookings.length} of {totalCount} bookings.
        </p>
      </div>

      {isLoading ? (
        <div className="mb-4">
          <SkeletonTable rows={8} cols={7} />
        </div>
      ) : null}

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error ? (
        <>
          <div className="overflow-hidden rounded-3xl border border-themed bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="table-themed min-w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-4">Booking Token</th>
                    <th className="px-4 py-4">Client Name</th>
                    <th className="px-4 py-4">Client Phone</th>
                    <th className="px-4 py-4">Doctor</th>
                    <th className="px-4 py-4">Preferred Date</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="cell-muted px-4 py-8 text-center text-sm">
                        No bookings match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-4 py-4 font-mono text-xs">
                          <Link
                            href={`/crm/bookings/${booking.id}`}
                            className="transition-colors hover:text-foreground/70"
                          >
                            {booking.token ?? booking.id}
                          </Link>
                        </td>
                        <td className="px-4 py-4 font-medium">
                          {booking.user.name ?? "-"}
                        </td>
                        <td className="cell-muted px-4 py-4">
                          {booking.user.phone ?? "-"}
                        </td>
                        <td className="cell-muted px-4 py-4">
                          {booking.doctor?.name ?? "-"}
                        </td>
                        <td className="cell-muted px-4 py-4">
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
                            className="inline-flex h-9 items-center justify-center rounded-md border border-themed bg-card px-3 text-xs font-medium text-page transition-colors hover:bg-black/5 dark:hover:bg-white/5"
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
            <p className="px-4 pb-4 text-xs text-muted md:hidden">Scroll to see more</p>
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
    </>
  );
}
