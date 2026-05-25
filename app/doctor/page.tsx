"use client";

import { useEffect, useState } from "react";

type DoctorStats = {
  doctorName: string;
  totalAssignedBookings: number;
  pendingBookings: number;
  completedBookings: number;
  error?: string;
};

export default function DoctorDashboardPage() {
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/doctor/stats");
        const data = (await response.json()) as DoctorStats;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load doctor stats.");
        }

        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load doctor stats.");
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <section className="flex min-h-screen flex-col bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-3xl border border-black/10 bg-background p-8 shadow-sm dark:border-white/10">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome back{stats?.doctorName ? `, ${stats.doctorName}` : ""}.
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Here’s a quick look at your bookings.
          </p>

          {isLoading ? (
            <p className="mt-6 text-sm text-foreground/70">Loading your stats...</p>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {stats && !isLoading && !error ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-black/10 bg-white p-6 text-sm text-foreground shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <p className="text-sm font-medium text-foreground/70">Total Assigned Bookings</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">
                  {stats.totalAssignedBookings}
                </p>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-6 text-sm text-foreground shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <p className="text-sm font-medium text-foreground/70">Pending Bookings</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">
                  {stats.pendingBookings}
                </p>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-6 text-sm text-foreground shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <p className="text-sm font-medium text-foreground/70">Completed Bookings</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">
                  {stats.completedBookings}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
