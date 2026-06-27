import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type AnalyticsPeriod = "today" | "week" | "month" | "year" | "all" | "custom";

type ChartBucket = {
  label: string;
  start: Date;
  end: Date;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

function addMonths(date: Date, months: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + months,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

function formatHourLabel(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${hour12} ${suffix}`;
}

function formatDayLabel(date: Date) {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getDate()}`;
}

function formatMonthYearLabel(date: Date) {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

function parsePeriod(value: string | null): AnalyticsPeriod {
  if (
    value === "today" ||
    value === "week" ||
    value === "month" ||
    value === "year" ||
    value === "all" ||
    value === "custom"
  ) {
    return value;
  }

  return "month";
}

function parseDateParam(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function buildHourlyBuckets(day: Date): ChartBucket[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    label: formatHourLabel(hour),
    start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0),
    end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 59, 59, 999),
  }));
}

function buildDailyBuckets(start: Date, end: Date, labelByWeekday = false): ChartBucket[] {
  const buckets: ChartBucket[] = [];
  let cursor = startOfDay(start);
  const finalDay = startOfDay(end);

  while (cursor.getTime() <= finalDay.getTime()) {
    buckets.push({
      label: labelByWeekday ? WEEKDAY_LABELS[cursor.getDay()] : formatDayLabel(cursor),
      start: startOfDay(cursor),
      end: endOfDay(cursor),
    });
    cursor = addDays(cursor, 1);
  }

  return buckets;
}

function buildMonthBuckets(start: Date, end: Date, includeYear: boolean): ChartBucket[] {
  const buckets: ChartBucket[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0);
  const finalMonth = new Date(end.getFullYear(), end.getMonth(), 1, 0, 0, 0, 0);

  while (cursor.getTime() <= finalMonth.getTime()) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);

    buckets.push({
      label: includeYear ? formatMonthYearLabel(cursor) : MONTH_LABELS[cursor.getMonth()],
      start: monthStart,
      end: monthEnd,
    });

    cursor = addMonths(cursor, 1);
  }

  return buckets;
}

async function resolveRangeAndBuckets(period: AnalyticsPeriod, request: Request) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const { searchParams } = new URL(request.url);

  if (period === "today") {
    return {
      start: todayStart,
      end: todayEnd,
      buckets: buildHourlyBuckets(now),
      periodLabel: `Today (${formatDayLabel(now)})`,
    };
  }

  if (period === "week") {
    const start = startOfDay(addDays(now, -6));

    return {
      start,
      end: todayEnd,
      buckets: buildDailyBuckets(start, todayEnd, true),
      periodLabel: `Last 7 days (${formatDayLabel(start)} - ${formatDayLabel(now)})`,
    };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    return {
      start,
      end: todayEnd,
      buckets: buildDailyBuckets(start, todayEnd),
      periodLabel: `${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`,
    };
  }

  if (period === "year") {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

    return {
      start,
      end: todayEnd,
      buckets: buildMonthBuckets(start, todayEnd, false),
      periodLabel: `${now.getFullYear()}`,
    };
  }

  if (period === "custom") {
    const parsedStart = parseDateParam(searchParams.get("start"));
    const parsedEnd = parseDateParam(searchParams.get("end"));

    if (!parsedStart || !parsedEnd) {
      return {
        error: Response.json(
          { error: "Valid start and end ISO date strings are required for custom period." },
          { status: 400 },
        ),
      };
    }

    const start = startOfDay(parsedStart);
    const end = endOfDay(parsedEnd);

    if (end.getTime() < start.getTime()) {
      return {
        error: Response.json(
          { error: "End date must be after start date." },
          { status: 400 },
        ),
      };
    }

    return {
      start,
      end,
      buckets: buildDailyBuckets(start, end),
      periodLabel: `${formatDayLabel(start)} - ${formatDayLabel(end)}`,
    };
  }

  const earliestMembership = await db.membership.findFirst({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      createdAt: true,
    },
  });

  if (!earliestMembership) {
    return {
      start: todayStart,
      end: todayEnd,
      buckets: [],
      periodLabel: "All time",
    };
  }

  const start = startOfDay(earliestMembership.createdAt);

  return {
    start,
    end: todayEnd,
    buckets: buildMonthBuckets(start, todayEnd, true),
    periodLabel: "All time",
  };
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = parsePeriod(searchParams.get("period"));
  const rangeResult = await resolveRangeAndBuckets(period, request);

  if ("error" in rangeResult) {
    return rangeResult.error;
  }

  const { start, end, buckets, periodLabel } = rangeResult;
  const memberships = await db.membership.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      createdAt: true,
      status: true,
    },
  });

  const summary = {
    total: memberships.length,
    active: 0,
    pending: 0,
    expired: 0,
    cancelled: 0,
  };

  for (const membership of memberships) {
    if (membership.status === "ACTIVE") {
      summary.active += 1;
    } else if (membership.status === "PENDING") {
      summary.pending += 1;
    } else if (membership.status === "EXPIRED") {
      summary.expired += 1;
    } else if (membership.status === "CANCELLED") {
      summary.cancelled += 1;
    }
  }

  const chartData = buckets.map((bucket) => ({
    label: bucket.label,
    memberships: memberships.filter(
      (membership) =>
        membership.createdAt.getTime() >= bucket.start.getTime() &&
        membership.createdAt.getTime() <= bucket.end.getTime(),
    ).length,
  }));

  return Response.json({
    chartData,
    summary,
    periodLabel,
  });
}
