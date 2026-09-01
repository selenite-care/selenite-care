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
          <h1
            className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Welcome back
            {stats?.doctorName ? (
              <>
                ,{" "}
                <span className="bg-gradient-to-r from-[#B87B68] via-[#C6A56B] to-[#884F38] bg-clip-text text-transparent dark:from-[#D4B47A] dark:via-[#B87B68] dark:to-[#EADDCD]">
                  {stats.doctorName}
                </span>
              </>
            ) : null}
            .
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
