"use client";

import { useEffect, useState } from "react";

type AdminStats = {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
};

const statLabels = [
  { key: "totalUsers", label: "Total Users" },
  { key: "totalBookings", label: "Total Bookings" },
  { key: "totalRevenue", label: "Total Revenue" },
  { key: "pendingBookings", label: "Pending Bookings" },
] satisfies Array<{ key: keyof AdminStats; label: string }>;

function formatStat(key: keyof AdminStats, value: number) {
  if (key === "totalRevenue") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  return new Intl.NumberFormat("en-US").format(value);
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/admin/stats");

        if (!response.ok) {
          throw new Error("Unable to load admin stats.");
        }

        const data = (await response.json()) as AdminStats;
        setStats(data);
      } catch {
        setError("Admin stats are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <section>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Dashboard Overview
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          A quick snapshot of Selenite Care activity.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-foreground/70">Loading stats...</p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {stats ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {statLabels.map((stat) => (
            <article
              key={stat.key}
              className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10"
            >
              <p className="text-sm font-medium text-foreground/60">
                {stat.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                {formatStat(stat.key, stats[stat.key])}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
