"use client";

import { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import BookingAnalyticsWidget from "@/components/analytics/BookingAnalyticsWidget";
import MembershipAnalyticsWidget from "@/components/analytics/MembershipAnalyticsWidget";
import { SkeletonStat } from "@/components/ui/Skeleton";

export const dynamic = "force-dynamic";

type AdminStats = {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
};

type SkinAnalysisStats = {
  totalAnalyses: number;
  analysesToday: number;
  commonConcerns: Array<{
    concern: string;
    count: number;
  }>;
  skinTypeDistribution: Array<{
    skinType: string;
    count: number;
  }>;
};

const statLabels = [
  { key: "totalUsers", label: "Total Users" },
  { key: "totalBookings", label: "Total Bookings" },
  // { key: "totalRevenue", label: "Total Revenue" },
  { key: "pendingBookings", label: "Pending Bookings" },
] satisfies Array<{ key: keyof AdminStats; label: string }>;

const SKIN_TYPE_COLORS = [
  "#D4B47A",
  "#B87B68",
  "#6A8F7A",
  "#6F8FBF",
  "#D9899E",
  "#8C7967",
];

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
  const [skinAnalysisStats, setSkinAnalysisStats] =
    useState<SkinAnalysisStats | null>(null);
  const [error, setError] = useState("");
  const [skinAnalysisError, setSkinAnalysisError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSkinAnalysis, setIsLoadingSkinAnalysis] = useState(true);

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

  useEffect(() => {
    async function loadSkinAnalysisStats() {
      try {
        const response = await fetch("/api/admin/skin-analysis/stats", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | SkinAnalysisStats
          | { error?: string }
          | null;

        if (!response.ok) {
          throw new Error(
            data && "error" in data
              ? data.error ?? "Unable to load skin analysis stats."
              : "Unable to load skin analysis stats.",
          );
        }

        setSkinAnalysisStats(data as SkinAnalysisStats);
      } catch {
        setSkinAnalysisError("Skin analysis stats are not available right now.");
      } finally {
        setIsLoadingSkinAnalysis(false);
      }
    }

    loadSkinAnalysisStats();
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
        <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
          A quick snapshot of Selenite Care activity.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: statLabels.length }).map((_, index) => (
            <SkeletonStat key={index} />
          ))}
        </div>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {stats ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {statLabels.map((stat) => (
            <article
              key={stat.key}
              className="rounded-lg border border-[#EADDCD] border-l-4 border-l-[#B87B68] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]"
              style={{
                borderLeftWidth: "4px",
              }}
            >
              <p className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                {stat.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]">
                {formatStat(stat.key, stats[stat.key])}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      <section className="mt-8 rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2
              className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Skin Analysis Overview
            </h2>
            <p className="mt-2 text-sm text-[#884F38] dark:text-[#8A7D75]">
              AI report activity and the most frequent client skin concerns.
            </p>
          </div>
        </div>

        {isLoadingSkinAnalysis ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>
        ) : skinAnalysisError ? (
          <p className="mt-6 text-sm text-red-600">{skinAnalysisError}</p>
        ) : skinAnalysisStats ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-xl border border-[#EADDCD] bg-[#F8F5F0] p-5 dark:border-[#3D3530] dark:bg-[#1A1814]">
                  <p className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                    Total Analyses
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                    {skinAnalysisStats.totalAnalyses.toLocaleString("en-US")}
                  </p>
                </article>

                <article className="rounded-xl border border-[#EADDCD] bg-[#F8F5F0] p-5 dark:border-[#3D3530] dark:bg-[#1A1814]">
                  <p className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                    Today
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                    {skinAnalysisStats.analysesToday.toLocaleString("en-US")}
                  </p>
                </article>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                  Top Concerns
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skinAnalysisStats.commonConcerns.slice(0, 3).length > 0 ? (
                    skinAnalysisStats.commonConcerns.slice(0, 3).map((item) => (
                      <span
                        key={item.concern}
                        className="rounded-full border border-[#D4B47A]/50 bg-[#FFF8E6] px-3 py-1 text-xs font-medium text-[#8A641D] dark:bg-[#33291C] dark:text-[#F3DFA6]"
                      >
                        {item.concern} ({item.count})
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#884F38] dark:text-[#8A7D75]">
                      No concerns recorded yet.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-[#EADDCD] bg-[#F8F5F0] p-4 dark:border-[#3D3530] dark:bg-[#1A1814]">
              {skinAnalysisStats.skinTypeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={skinAnalysisStats.skinTypeDistribution}
                      dataKey="count"
                      nameKey="skinType"
                      innerRadius={42}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {skinAnalysisStats.skinTypeDistribution.map((entry, index) => (
                        <Cell
                          key={entry.skinType}
                          fill={SKIN_TYPE_COLORS[index % SKIN_TYPE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#FFFFFF",
                        border: "1px solid #EADDCD",
                        borderRadius: 10,
                        color: "#2B2B2B",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[190px] items-center justify-center text-center text-sm text-[#884F38] dark:text-[#8A7D75]">
                  No skin type data yet.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <div className="mt-8 w-full">
        <BookingAnalyticsWidget />
      </div>

      <div className="mt-8 w-full">
        <MembershipAnalyticsWidget />
      </div>
    </section>
  );
}
