"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateOnly } from "@/lib/dateUtils";

type BookingRescheduleControlProps = {
  bookingId: string;
  currentAppointmentTime: string | null;
  disabled?: boolean;
};

type RescheduleResponse = {
  booking?: {
    appointmentTime?: string | null;
  };
  error?: string;
};

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatAppointmentDate(value: string | null) {
  return value ? formatDateOnly(value) : "Not scheduled";
}

export default function BookingRescheduleControl({
  bookingId,
  currentAppointmentTime,
  disabled = false,
}: BookingRescheduleControlProps) {
  const router = useRouter();
  const [currentDateValue, setCurrentDateValue] = useState(
    toDateInputValue(currentAppointmentTime),
  );
  const [selectedDate, setSelectedDate] = useState(
    toDateInputValue(currentAppointmentTime),
  );
  const [currentDateLabel, setCurrentDateLabel] = useState(
    formatAppointmentDate(currentAppointmentTime),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasDateChanged = selectedDate !== currentDateValue;

  async function handleReschedule() {
    if (!selectedDate || isSubmitting || disabled) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/reschedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentDate: selectedDate,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | RescheduleResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to reschedule this booking.");
      }

      setCurrentDateValue(selectedDate);
      setCurrentDateLabel(formatAppointmentDate(data?.booking?.appointmentTime ?? null));
      setMessage("Appointment date updated.");
      router.refresh();
    } catch (rescheduleError) {
      setError(
        rescheduleError instanceof Error
          ? rescheduleError.message
          : "Unable to reschedule this booking.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-[#D8C7B5] bg-background p-6 dark:border-[#3D3530]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#C6A56B]" />
            <h2 className="text-lg font-semibold text-foreground">
              Reschedule Appointment
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Current date:{" "}
            <span className="font-medium text-foreground">{currentDateLabel}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,260px)_auto] sm:items-end">
        <label className="block">
          <span className="text-sm font-medium text-foreground">New date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setMessage("");
              setError("");
            }}
            disabled={disabled}
            className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#C6A56B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#3D3530]"
          />
        </label>

        <button
          type="button"
          onClick={handleReschedule}
          disabled={disabled || isSubmitting || !selectedDate || !hasDateChanged}
          className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#3A3734] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
        >
          {isSubmitting ? "Updating..." : "Update Date"}
        </button>
      </div>

      {disabled ? (
        <p className="mt-4 text-sm text-foreground/60">
          Completed or cancelled bookings cannot be rescheduled.
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-300">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
