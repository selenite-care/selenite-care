"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type IntentMetric = {
  id: string;
  emoji: string;
  label: string;
  count: number;
  percentage: number;
};

type IntentChartPoint = {
  date: string;
  label: string;
  basic_care: number;
  target_concerns: number;
  healthy_glow: number;
  professional_consultation: number;
  total: number;
};

type OnboardingMetricsResponse = {
  metrics?: IntentMetric[];
  chartData?: IntentChartPoint[];
  total?: number;
  error?: string;
};

export default function OnboardingIntentMetrics() {
  const [metrics, setMetrics] = useState<IntentMetric[]>([]);
  const [chartData, setChartData] = useState<IntentChartPoint[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      try {
        const response = await fetch("/api/admin/onboarding-metrics", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | OnboardingMetricsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load intent metrics.");
        }

        if (!isMounted) {
          return;
        }

        setMetrics(data?.metrics ?? []);
        setChartData(data?.chartData ?? []);
        setTotal(data?.total ?? 0);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load intent metrics.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-[#EADDCD] bg-white p-5 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B87B68] dark:text-[#D4B47A]">
            Intent Metrics
          </p>
          <h2
            className="mt-2 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Visitor Intent Trends
          </h2>
        </div>
        <p className="text-sm text-[#884F38] dark:text-[#8A7D75]">
          {total} onboarding submissions in the last 30 days
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl bg-[#F8F5F0] dark:bg-[#1A1814]"
            />
          ))}
        </div>
      ) : error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article
                key={metric.id}
                className="rounded-xl border border-[#EADDCD] bg-[#F8F5F0] p-4 dark:border-[#3D3530] dark:bg-[#1A1814]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {metric.emoji}
                  </span>
                  <span className="rounded-full bg-[#B87B68]/12 px-2.5 py-1 text-xs font-bold text-[#B87B68] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
                    {metric.percentage}%
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-5 text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-bold text-[#B87B68] dark:text-[#D4B47A]">
                  {metric.count}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-[#EADDCD] bg-[#FCFAF7] p-4 dark:border-[#3D3530] dark:bg-[#1A1814]">
            <p className="mb-4 text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Onboarding submissions over the last 30 days
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#EADDCD" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#884F38", fontSize: 12 }} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#884F38", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #EADDCD",
                    borderRadius: 10,
                    color: "#2B2B2B",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="basic_care"
                  name="Basic Care"
                  stroke="#B87B68"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#B87B68" }}
                />
                <Line
                  type="monotone"
                  dataKey="target_concerns"
                  name="Target Concerns"
                  stroke="#C6A56B"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#C6A56B" }}
                />
                <Line
                  type="monotone"
                  dataKey="healthy_glow"
                  name="Healthy Glow"
                  stroke="#6B8F71"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#6B8F71" }}
                />
                <Line
                  type="monotone"
                  dataKey="professional_consultation"
                  name="Consultation"
                  stroke="#344356"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#344356" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
