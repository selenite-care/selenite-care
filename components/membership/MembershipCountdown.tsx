"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MembershipTier = "SIGNATURE" | "CRYSTAL" | "PLATINUM" | string;

type MembershipCountdownProps = {
  createdAt: Date;
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

function getProgressBarColor(usedPercentage: number) {
  if (usedPercentage > 80) {
    return "bg-red-500";
  }

  if (usedPercentage >= 50) {
    return "bg-amber-500";
  }

  return "bg-[#B87B68]";
}

export default function MembershipCountdown({
  createdAt,
  expiresAt,
  membershipId,
  tier,
}: MembershipCountdownProps) {
  const startDate = useMemo(() => new Date(createdAt), [createdAt]);
  const targetDate = useMemo(() => new Date(expiresAt), [expiresAt]);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const remaining = now === null ? null : getTimeRemaining(targetDate, now);
  const totalMembershipMs = Math.max(
    targetDate.getTime() - startDate.getTime(),
    1,
  );
  const usedMembershipMs =
    now === null ? 0 : Math.max(now - startDate.getTime(), 0);
  const usedPercentage = Math.min(
    Math.max((usedMembershipMs / totalMembershipMs) * 100, 0),
    100,
  );
  const daysRemaining = remaining?.days ?? 0;
  const shouldShowRenewButton = !remaining?.expired && daysRemaining < 14;

  return (
    <article className="rounded-lg border border-[#EADDCD] border-l-4 border-l-[#B87B68] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
            Active Membership
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]">
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
          <p className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
            Time Remaining
          </p>

          {remaining?.expired ? (
            <p className="mt-4 text-lg font-semibold text-red-600">
              Membership Expired
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Days",
                  value: remaining ? remaining.days.toString() : "--",
                },
                {
                  label: "Hours",
                  value: remaining ? pad(remaining.hours) : "--",
                },
                {
                  label: "Minutes",
                  value: remaining ? pad(remaining.minutes) : "--",
                },
                {
                  label: "Seconds",
                  value: remaining ? pad(remaining.seconds) : "--",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="min-w-[80px] rounded-md border border-[#EADDCD] bg-[#F8F5F0] px-4 py-3 text-center dark:border-[#3D3530] dark:bg-[#1A1814]"
                >
                  <p className="text-2xl font-semibold tabular-nums text-[#B87B68]">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#2B2B2B] dark:text-[#F0EDE8]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-[#EADDCD] pt-5 dark:border-[#3D3530]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="h-2.5 overflow-hidden rounded-full bg-[#EFE7DC] dark:bg-[#1A1814]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                  usedPercentage,
                )}`}
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
              {remaining?.expired
                ? "0 days remaining"
                : `${daysRemaining} days remaining`}
            </p>
          </div>

          {shouldShowRenewButton ? (
            <Link
              href="/services"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-[#B87B68] px-5 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#D4B47A] hover:text-[#141210]"
            >
              Renew Membership
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
