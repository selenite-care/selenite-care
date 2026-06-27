"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsPeriod = "today" | "week" | "month" | "year" | "all" | "custom";
type ChartType = "bar" | "line";

type ChartDataPoint = {
  label: string;
  bookings: number;
};

type BookingAnalyticsSummary = {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
};

type BookingAnalyticsResponse = {
  chartData?: ChartDataPoint[];
  summary?: BookingAnalyticsSummary;
  periodLabel?: string;
  error?: string;
};

const PERIOD_TABS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last Week" },
  { value: "month", label: "Last Month" },
  { value: "year", label: "Last Year" },
  { value: "all", label: "Maximum" },
  { value: "custom", label: "Custom" },
];

const EMPTY_SUMMARY: BookingAnalyticsSummary = {
  total: 0,
  pending: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
};

function getDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getInitialCustomStart() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return getDateInputValue(date);
}

function ChartTypeIcon({ type }: { type: ChartType }) {
  if (type === "line") {
    return (
      <span className="relative h-4 w-5" aria-hidden="true">
        <span className="absolute bottom-1 left-0 h-px w-2 rotate-[-32deg] rounded-full bg-current" />
        <span className="absolute bottom-2 left-1.5 h-px w-2 rotate-[28deg] rounded-full bg-current" />
        <span className="absolute bottom-1.5 right-0 h-px w-2 rotate-[-30deg] rounded-full bg-current" />
      </span>
    );
  }

  return (
    <span className="flex h-4 w-5 items-end justify-center gap-0.5" aria-hidden="true">
      <span className="h-2 w-1 rounded-sm bg-current" />
      <span className="h-4 w-1 rounded-sm bg-current" />
      <span className="h-3 w-1 rounded-sm bg-current" />
    </span>
  );
}

export default function BookingAnalyticsWidget() {
  const [activePeriod, setActivePeriod] = useState<AnalyticsPeriod>("today");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [customStart, setCustomStart] = useState(getInitialCustomStart);
  const [customEnd, setCustomEnd] = useState(() => getDateInputValue(new Date()));
  const [appliedCustomStart, setAppliedCustomStart] = useState(customStart);
  const [appliedCustomEnd, setAppliedCustomEnd] = useState(customEnd);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [summary, setSummary] = useState<BookingAnalyticsSummary>(EMPTY_SUMMARY);
  const [periodLabel, setPeriodLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalytics() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ period: activePeriod });

        if (activePeriod === "custom") {
          params.set("start", appliedCustomStart);
          params.set("end", appliedCustomEnd);
        }

        const response = await fetch(`/api/admin/analytics/bookings?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => null)) as
          | BookingAnalyticsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load booking analytics.");
        }

        setChartData(data?.chartData ?? []);
        setSummary(data?.summary ?? EMPTY_SUMMARY);
        setPeriodLabel(data?.periodLabel ?? "");
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setChartData([]);
        setSummary(EMPTY_SUMMARY);
        setPeriodLabel("");
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load booking analytics.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => controller.abort();
  }, [activePeriod, appliedCustomEnd, appliedCustomStart]);

  function handleApplyCustomDates() {
    setAppliedCustomStart(customStart);
    setAppliedCustomEnd(customEnd);
  }

  const customDatesApplied =
    customStart === appliedCustomStart && customEnd === appliedCustomEnd;

  const statCards = [
    {
      label: "Total",
      value: summary.total,
      className: "text-[#2B2B2B] dark:text-[#F0EDE8]",
    },
    {
      label: "Pending",
      value: summary.pending,
      className: "text-amber-600 dark:text-amber-300",
    },
    {
      label: "Confirmed",
      value: summary.confirmed,
      className: "text-blue-600 dark:text-blue-300",
    },
    {
      label: "Completed",
      value: summary.completed,
      className: "text-green-600 dark:text-green-300",
    },
    {
      label: "Cancelled",
      value: summary.cancelled,
      className: "text-red-600 dark:text-red-300",
    },
  ];

  return (
    <section className="rounded-2xl border border-[#D8C7B5] bg-white p-5 shadow-sm dark:border-[#3D3530] dark:bg-[#242220] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Booking Overview
          </h2>
        </div>

        <div className="inline-flex w-fit rounded-full border border-[#D8C7B5] bg-[#F8F5F0] p-1 dark:border-[#3D3530] dark:bg-[#1A1814]">
          {(["bar", "line"] as const).map((type) => {
            const isActive = chartType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setChartType(type)}
                className={`inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#2B2B2B] text-[#F8F5F0] dark:bg-[#C6A56B] dark:text-[#141210]"
                    : "text-[#8C7967] hover:bg-white dark:text-[#8A7D75] dark:hover:bg-[#242220]"
                }`}
                aria-label={`Show ${type} chart`}
                title={`Show ${type} chart`}
              >
                <ChartTypeIcon type={type} />
                <span>{type === "bar" ? "Bar" : "Line"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="-mx-1 mt-6 overflow-x-auto px-1">
        <div className="flex min-w-max gap-2">
          {PERIOD_TABS.map((tab) => {
            const isActive = activePeriod === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActivePeriod(tab.value)}
                className={`h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[#2B2B2B] bg-[#2B2B2B] text-[#F8F5F0] dark:border-[#C6A56B] dark:bg-[#C6A56B] dark:text-[#141210]"
                    : "border-[#D8C7B5] bg-[#F8F5F0] text-[#8C7967] hover:border-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activePeriod === "custom" ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7967] dark:text-[#8A7D75]">
              Start Date
            </span>
            <input
              type="date"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-[#F8F5F0] px-3 text-sm text-[#2B2B2B] outline-none focus:border-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7967] dark:text-[#8A7D75]">
              End Date
            </span>
            <input
              type="date"
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-[#F8F5F0] px-3 text-sm text-[#2B2B2B] outline-none focus:border-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
            />
          </label>

          <button
            type="button"
            onClick={handleApplyCustomDates}
            className={`inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors ${
              customDatesApplied
                ? "bg-[#2B2B2B] text-[#F8F5F0] dark:bg-[#3D3530]"
                : "bg-[#C6A56B] text-[#2B2B2B] hover:bg-[#D4B47A]"
            }`}
          >
            {customDatesApplied ? "Applied" : "Apply"}
          </button>
        </div>
      ) : null}

      {periodLabel ? (
        <p className="mt-5 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
          {periodLabel}
        </p>
      ) : null}

      <div className="-mx-1 mt-5 overflow-x-auto px-1">
        <div className="grid min-w-[620px] grid-cols-5 gap-3">
          {statCards.map((stat) => (
            <article
              key={stat.label}
              className="rounded-xl border border-[#D8C7B5] bg-[#F8F5F0] px-4 py-3 dark:border-[#3D3530] dark:bg-[#1A1814]"
            >
              <p className={`text-2xl font-bold ${stat.className}`}>{stat.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#8C7967] dark:text-[#8A7D75]">
                {stat.label}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#D8C7B5] bg-[#F8F5F0] p-4 dark:border-[#3D3530] dark:bg-[#1A1814]">
        {isLoading ? (
          <div className="flex h-[300px] items-end justify-center gap-5">
            <div className="h-32 w-12 animate-pulse rounded-t-lg bg-[#D8C7B5] dark:bg-[#3D3530]" />
            <div className="h-52 w-12 animate-pulse rounded-t-lg bg-[#D8C7B5] dark:bg-[#3D3530]" />
            <div className="h-40 w-12 animate-pulse rounded-t-lg bg-[#D8C7B5] dark:bg-[#3D3530]" />
          </div>
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-center text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid stroke="#D8C7B5" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#B8A89A", fontSize: 12 }} />
                <YAxis tick={{ fill: "#B8A89A", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #D8C7B5",
                    borderRadius: 10,
                    color: "#2B2B2B",
                  }}
                  formatter={(value) => [value, "Bookings"]}
                />
                <Bar dataKey="bookings" fill="#C6A56B" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid stroke="#D8C7B5" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#B8A89A", fontSize: 12 }} />
                <YAxis tick={{ fill: "#B8A89A", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #D8C7B5",
                    borderRadius: 10,
                    color: "#2B2B2B",
                  }}
                  formatter={(value) => [value, "Bookings"]}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#C6A56B"
                  strokeWidth={3}
                  dot={{ fill: "#C6A56B", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#C6A56B" }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
