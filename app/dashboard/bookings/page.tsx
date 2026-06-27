"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDateOnly } from "@/lib/dateUtils";

type ClientBooking = {
  id: string;
  token: string;
  appointmentTime: string | null;
  status: string;
  doctor: {
    name: string;
    designation: string;
  } | null;
  service: {
    name: string;
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
    return value ? formatDateOnly(value) : "Not scheduled";
  }

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{
            fontFamily: "Playfair Display, serif",
          }}>
          My Bookings
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
          Track your appointment requests and preferred dates.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-[#B8A89A] dark:text-[#8A7D75]">Loading bookings...</p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && bookings.length === 0 ? (
        <p className="mt-8 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
          You do not have any bookings yet.
        </p>
      ) : null}

      {!isLoading && !error && bookings.length > 0 ? (
        <>
          <div className="mt-8 grid gap-4 md:hidden">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="bg-card border-themed rounded-xl border p-5"
              >
                <p className="font-mono text-sm font-semibold text-[#C6A56B]">
                  {booking.token}
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967] dark:text-[#8A7D75]">
                      Doctor Name
                    </p>
                    <p className="mt-1 text-sm text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {booking.doctor?.name ?? "Not assigned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967] dark:text-[#8A7D75]">
                      Preferred Date
                    </p>
                    <p className="mt-1 text-sm text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {formatAppointmentTime(booking.appointmentTime)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967] dark:text-[#8A7D75]">
                      Booking Status
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                          booking.status,
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/dashboard/bookings/${booking.id}`}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#B8A89A] dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
                >
                  View Details
                </Link>
              </article>
            ))}
          </div>

          <div className="bg-card border-themed mt-8 hidden overflow-hidden rounded-lg border md:block">
            <div className="overflow-x-auto">
              <table className="table-themed w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-medium">Booking Token</th>
                    <th className="px-4 py-3 font-medium">Doctor Name</th>
                    <th className="px-4 py-3 font-medium">Preferred Date</th>
                    <th className="px-4 py-3 font-medium">Booking Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-4 py-4 font-mono text-xs text-foreground/70">
                        {booking.token}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {booking.doctor?.name ?? "Not assigned"}
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
                      <td className="px-4 py-4">
                        <Link
                          href={`/dashboard/bookings/${booking.id}`}
                          className="border-themed text-page inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
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
        </>
      ) : null}
    </section>
  );
}
