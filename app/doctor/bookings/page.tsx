"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatDateOnly } from "@/lib/dateUtils";

type DoctorBooking = {
  id: string;
  token: string;
  appointmentTime: string | null;
  status: string;
  user: {
    name: string;
  };
  service: {
    name: string;
  } | null;
};

type DoctorBookingsResponse = {
  bookings?: DoctorBooking[];
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

function getStatusBadgeClasses(status: string) {
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

export default function DoctorBookingsPage() {
  const [bookings, setBookings] = useState<DoctorBooking[]>([]);
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
  }, [statusFilter]);

  useEffect(() => {
    async function loadBookings() {
      try {
        setError("");
        setIsLoading(true);

        const searchParams = new URLSearchParams();
        searchParams.set("page", String(currentPage));
        searchParams.set("limit", String(ITEMS_PER_PAGE));
        if (statusFilter !== "All") {
          searchParams.set("statusFilter", statusFilter);
        }

        const response = await fetch(
          `/api/doctor/bookings?${searchParams.toString()}`,
        );
        if (!response.ok) {
          throw new Error("Unable to load bookings.");
        }

        const data = (await response.json()) as DoctorBookingsResponse;
        setBookings(data.bookings ?? []);
        setTotalCount(data.totalCount ?? 0);
      } catch {
        setError("Unable to load your bookings right now.");
        setBookings([]);
        setTotalCount(0);
      } finally {
        setHasLoaded(true);
        setIsLoading(false);
      }
    }

    loadBookings();
  }, [currentPage, statusFilter]);

  const isInitialLoading = isLoading && !hasLoaded;

  function formatAppointmentTime(value: string | null) {
    return value ? formatDateOnly(value) : "Not scheduled";
  }

  return (
    <section>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          My Bookings
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          View all assigned bookings and their appointment status.
        </p>
      </div>

      {isInitialLoading ? (
        <div className="mt-8">
          <SkeletonTable rows={6} cols={5} />
        </div>
      ) : null}

      {error ? (
        <p className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!isInitialLoading && !error && statusFilter === "All" && totalCount === 0 ? (
        <p className="mt-8 text-sm text-foreground/70">
          No bookings have been assigned to you yet.
        </p>
      ) : null}

      {!isInitialLoading && !error && (bookings.length > 0 || statusFilter !== "All") ? (
        <>
          <div className="mt-8 rounded-lg border border-black/10 bg-background p-4 dark:border-white/10">
            <div className="max-w-xs">
              <label
                htmlFor="booking-status-filter"
                className="text-sm font-medium text-foreground"
              >
                Filter by status
              </label>
              <select
                id="booking-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as (typeof bookingStatuses)[number],
                  )
                }
                className="mt-2 h-11 w-full rounded-md border border-black/10 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-white/10"
              >
                {bookingStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-4 text-sm text-foreground/70">
              Showing {bookings.length} of {totalCount} bookings.
            </p>
            {isLoading ? (
              <p className="mt-2 text-xs text-foreground/60">
                Updating results...
              </p>
            ) : null}
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
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
                  {bookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-foreground/70"
                      >
                        No bookings match this status.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-black/10 last:border-0 dark:border-white/10">
                        <td className="px-4 py-4 font-mono text-xs text-foreground/70">
                          {booking.token}
                        </td>
                        <td className="px-4 py-4 text-foreground/70">
                          {booking.user.name}
                        </td>
                        {/* <td className="px-4 py-4 text-foreground/70">
                          {booking.service?.name ?? "No service attached"}
                        </td> */}
                        <td className="px-4 py-4 text-foreground/70">
                          {formatAppointmentTime(booking.appointmentTime)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                              booking.status,
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/doctor/bookings/${booking.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
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

          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalCount}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}
