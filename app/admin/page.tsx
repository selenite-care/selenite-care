"use client";

import { useEffect, useState } from "react";
import BookingAnalyticsWidget from "@/components/analytics/BookingAnalyticsWidget";
import MembershipAnalyticsWidget from "@/components/analytics/MembershipAnalyticsWidget";

export const dynamic = "force-dynamic";

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
        <h1
          className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{
            fontFamily: "Playfair Display, serif",
          }}
        >
          Dashboard Overview
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
          A quick snapshot of Selenite Care activity.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
          Loading stats...
        </p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {stats ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {statLabels.map((stat) => (
            <article
              key={stat.key}
              className="rounded-lg border border-[#D8C7B5] border-l-4 border-l-[#C6A56B] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]"
              style={{
                borderLeftWidth: "4px",
              }}
            >
              <p className="text-sm font-medium text-[#B8A89A] dark:text-[#8A7D75]">
                {stat.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]">
                {formatStat(stat.key, stats[stat.key])}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-8 w-full">
        <BookingAnalyticsWidget />
      </div>

      <div className="mt-8 w-full">
        <MembershipAnalyticsWidget />
      </div>
    </section>
  );
}
