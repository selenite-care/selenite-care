"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdminBooking = {
  id: string;
  appointmentTime: string;
  status: string;
  user: {
    name: string | null;
    email: string;
  };
  service: {
    name: string;
  };
  payment: {
    status: string;
  } | null;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
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
        <div className="mt-8 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
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
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-black/10 last:border-0 dark:border-white/10"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-foreground/70">
                      {booking.id}
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
      ) : null}
    </section>
  );
}
