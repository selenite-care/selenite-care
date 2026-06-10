"use client";

import { useEffect, useMemo, useState } from "react";

type MembershipTier = "SIGNATURE" | "CRYSTAL" | "PLATINUM" | string;

type MembershipCountdownProps = {
  expiresAt: Date;
  membershipId: string;
  tier: MembershipTier;
};

function getTierStyles(tier: MembershipTier) {
  switch (tier) {
    case "PLATINUM":
      return {
        backgroundColor: "#2B2B2B",
        color: "#F8F5F0",
      };
    case "CRYSTAL":
      return {
        backgroundColor: "rgba(59, 130, 246, 0.14)",
        color: "#1D4ED8",
      };
    case "SIGNATURE":
    default:
      return {
        backgroundColor: "rgba(198, 165, 107, 0.16)",
        color: "#8A6A2F",
      };
  }
}

function getTimeRemaining(targetDate: Date, now: number) {
  const difference = targetDate.getTime() - now;

  if (difference <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
  };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export default function MembershipCountdown({
  expiresAt,
  membershipId,
  tier,
}: MembershipCountdownProps) {
  const targetDate = useMemo(() => new Date(expiresAt), [expiresAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const remaining = getTimeRemaining(targetDate, now);

  return (
    <article
      className="rounded-lg border p-6"
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "#D8C7B5",
        borderLeftColor: "#C6A56B",
        borderLeftWidth: "4px",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "#B8A89A" }}>
            Active Membership
          </p>
          <p
            className="mt-3 text-2xl font-semibold tracking-tight"
            style={{ color: "#2B2B2B" }}
          >
            {membershipId}
          </p>
          <div className="mt-4">
            <span
              className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
              style={getTierStyles(tier)}
            >
              {tier}
            </span>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-sm font-medium" style={{ color: "#B8A89A" }}>
            Time Remaining
          </p>

          {remaining.expired ? (
            <p className="mt-4 text-lg font-semibold text-red-600">
              Membership Expired
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Days", value: remaining.days.toString() },
                { label: "Hours", value: pad(remaining.hours) },
                { label: "Minutes", value: pad(remaining.minutes) },
                { label: "Seconds", value: pad(remaining.seconds) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="min-w-[80px] rounded-md border px-4 py-3 text-center"
                  style={{
                    borderColor: "#D8C7B5",
                    backgroundColor: "#F8F5F0",
                  }}
                >
                  <p
                    className="text-2xl font-semibold tabular-nums"
                    style={{ color: "#C6A56B" }}
                  >
                    {item.value}
                  </p>
                  <p
                    className="mt-1 text-xs font-medium uppercase tracking-[0.12em]"
                    style={{ color: "#2B2B2B" }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
