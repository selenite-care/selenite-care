"use client";

import { useEffect, useState } from "react";

type CrmStats = {
  totalClients: number;
  totalBookings: number;
  pendingBookings: number;
  recentBookings: Array<{
    id: string;
    token: string;
    appointmentTime: string | null;
    status: string;
    user: { name: string | null } | null;
    doctor: { name: string | null } | null;
    service: { name: string | null } | null;
  }>;
  error?: string;
};

export default function CrmPage() {
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/crm/stats");
        const data = (await response.json()) as CrmStats;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load CRM stats.");
        }

        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load CRM stats.");
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  function formatAppointmentTime(value: string | null) {
    return value
      ? new Date(value).toLocaleDateString("en-US")
      : "Not scheduled";
  }

  return (
    <section className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 rounded-3xl border border-black/10 bg-background p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-3xl font-semibold text-foreground">CRM Dashboard</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Review client and booking performance at a glance.
          </p>

          {isLoading ? (
            <p className="mt-6 text-sm text-foreground/70">Loading stats...</p>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {stats && !isLoading && !error ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                <p className="text-sm font-medium uppercase tracking-wide text-foreground/60">Total Clients</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">{stats.totalClients}</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                <p className="text-sm font-medium uppercase tracking-wide text-foreground/60">Total Bookings</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">{stats.totalBookings}</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                <p className="text-sm font-medium uppercase tracking-wide text-foreground/60">Pending Bookings</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">{stats.pendingBookings}</p>
              </div>
            </div>
          ) : null}
        </div>

        {stats && !isLoading && !error ? (
          <div className="rounded-3xl border border-black/10 bg-background p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-2xl font-semibold text-foreground">Recent Bookings</h2>
            <p className="mt-2 text-sm text-foreground/70">
              Latest booking activity across the platform.
            </p>

            <div className="mt-6 overflow-hidden rounded-3xl border border-black/10 dark:border-white/10">
              <table className="min-w-full divide-y divide-black/10 bg-white text-left dark:bg-zinc-900 dark:divide-white/10">
                <thead className="bg-zinc-100 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">Token</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">Client</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">Doctor</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">Service</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">Time</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 bg-background dark:bg-zinc-950 dark:divide-white/10">
                  {stats.recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-foreground/70">
                        No recent bookings found.
                      </td>
                    </tr>
                  ) : (
                    stats.recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-4 py-4 text-sm font-medium text-foreground">{booking.token}</td>
                        <td className="px-4 py-4 text-sm text-foreground/80">{booking.user?.name ?? "Unknown"}</td>
                        <td className="px-4 py-4 text-sm text-foreground/80">{booking.doctor?.name ?? "Unassigned"}</td>
                        <td className="px-4 py-4 text-sm text-foreground/80">{booking.service?.name ?? "Unknown"}</td>
                        <td className="px-4 py-4 text-sm text-foreground/80">
                          {formatAppointmentTime(booking.appointmentTime)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            booking.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                              : booking.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                              : booking.status === "COMPLETED"
                              ? "bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
