"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ClientBooking = {
  id: string;
  appointmentTime: string | null;
  status: string;
  service: {
    name: string;
  } | null;
  payment: {
    status: string;
  } | null;
};

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

export default function DashboardBookingsPage() {
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        const response = await fetch("/api/client/bookings");

        if (!response.ok) {
          throw new Error("Unable to load your bookings.");
        }

        const data = (await response.json()) as { bookings?: ClientBooking[] };
        setBookings(data.bookings ?? []);
      } catch {
        setError("Your bookings are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBookings();
  }, []);

  function formatAppointmentTime(value: string | null) {
    return value ? new Date(value).toLocaleString() : "Not scheduled";
  }

  return (
    <section>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          My Bookings
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Track your appointment status and payment details.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-foreground/70">Loading bookings...</p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && bookings.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/70">
          You do not have any bookings yet.
        </p>
      ) : null}

      {!isLoading && !error && bookings.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Booking Token</th>
                  <th className="px-4 py-3 font-medium">Service Name</th>
                  <th className="px-4 py-3 font-medium">Appointment Time</th>
                  <th className="px-4 py-3 font-medium">Booking Status</th>
                  <th className="px-4 py-3 font-medium">Payment Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-black/10 last:border-0 dark:border-white/10"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-foreground/70">
                      {booking.id}
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      {booking.service?.name ?? "No service attached"}
                    </td>
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
                    <td className="px-4 py-4 text-foreground/70">
                      {booking.payment?.status ?? "UNPAID"}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
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
      ) : null}
    </section>
  );
}
