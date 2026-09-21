"use client";

import { useMemo, useState } from "react";
import {
  formatAvailabilityDateLabel,
  parseAvailabilityEndTime,
  parseAvailableDays,
  toDateInputValue,
} from "@/lib/doctorAvailability";

type DoctorAvailabilityDatePickerProps = {
  id: string;
  availability?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export default function DoctorAvailabilityDatePicker({
  id,
  availability,
  value,
  onChange,
  className = "",
}: DoctorAvailabilityDatePickerProps) {
  const [now] = useState(() => new Date());
  const availableDays = useMemo(
    () => (availability ? parseAvailableDays(availability) : new Set<number>()),
    [availability],
  );
  const sameDayCutoff = useMemo(() => {
    if (!availability || !availableDays.has(now.getDay())) return null;

    const endTime = parseAvailabilityEndTime(availability);
    if (!endTime) return null;

    const cutoffMinutes = endTime.hours24 * 60 + endTime.minutes - 120;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return currentMinutes >= cutoffMinutes
      ? { date: toDateInputValue(now), endTimeLabel: endTime.endTimeLabel }
      : null;
  }, [availability, availableDays, now]);
  const dateOptions = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 30 }, (_, offset) => {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      const dateValue = toDateInputValue(date);

      return {
        value: dateValue,
        label: formatAvailabilityDateLabel(date),
        isAvailable:
          availableDays.has(date.getDay()) && sameDayCutoff?.date !== dateValue,
      };
    }).filter((option) => option.isAvailable);
  }, [availableDays, now, sameDayCutoff]);

  return (
    <div className={className}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!availability || dateOptions.length === 0}
        required
        className="h-12 w-full rounded-md border border-[#D4B47A] bg-white px-4 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] disabled:cursor-not-allowed disabled:bg-[#F1ECE6] disabled:text-[#8C7967] dark:bg-[#1F1B18] dark:text-[#F0EDE8] dark:disabled:bg-[#292522]"
      >
        <option value="">
          {availability
            ? dateOptions.length > 0
              ? "Select an available date"
              : "No available dates in the next 30 days"
            : "Select a doctor first"}
        </option>
        {dateOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs leading-5 text-[#6E6257] dark:text-[#B8AAA0]">
        Available dates are shown based on your selected doctor&apos;s schedule.
      </p>
      {sameDayCutoff ? (
        <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
          Same-day booking is closed because appointments must be booked at
          least 2 hours before the doctor&apos;s {sameDayCutoff.endTimeLabel} closing
          time.
        </p>
      ) : null}
    </div>
  );
}
