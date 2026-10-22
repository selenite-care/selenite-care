"use client";

import { useEffect, useState } from "react";

type AppointmentSlot = {
  time: string;
  label: string;
  available: boolean;
};

type SlotsResponse = {
  slots?: AppointmentSlot[];
  slotDuration?: number;
  error?: string;
};

type TimeSlotSelectorProps = {
  doctorId: string;
  date: string;
  value: string;
  onChange: (timeSlot: string) => void;
  compact?: boolean;
  showHeading?: boolean;
};

export default function TimeSlotSelector({
  doctorId,
  date,
  value,
  onChange,
  compact = false,
  showHeading = true,
}: TimeSlotSelectorProps) {
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [slotDuration, setSlotDuration] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doctorId || !date) return;

    const controller = new AbortController();
    let isMounted = true;

    async function loadSlots() {
      setIsLoading(true);
      setError("");

      try {
        const query = new URLSearchParams({ doctorId, date });
        const response = await fetch(`/api/appointment/slots?${query}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => null)) as
          | SlotsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load appointment slots.");
        }

        if (isMounted) {
          setSlots(data?.slots ?? []);
          setSlotDuration(data?.slotDuration ?? 20);
        }
      } catch (loadError) {
        if (isMounted && !controller.signal.aborted) {
          setSlots([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load appointment slots.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadSlots();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [date, doctorId]);

  if (!doctorId || !date) return null;

  return (
    <div
      className={
        compact
          ? "mt-4"
          : "mt-6 border-t border-[#EADDCD] pt-6 dark:border-[#3D3530]"
      }
    >
      {showHeading ? (
        <h3
          className={
            compact
              ? "text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
              : "text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
          }
          style={compact ? undefined : { fontFamily: "Playfair Display, serif" }}
        >
          Available Time Slots
        </h3>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]">
        Each consultation is {slotDuration} minutes.
      </p>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[52px] animate-pulse rounded-xl bg-[#EFE7DC] dark:bg-[#332F2B]"
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && slots.length === 0 ? (
        <p className="mt-4 text-sm text-[#6E6257] dark:text-[#8A7D75]">
          No slots available for this date.
        </p>
      ) : null}

      {!isLoading && !error && slots.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {slots.map((slot) => {
            const isSelected = value === slot.time;

            return (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => onChange(slot.time)}
                aria-pressed={isSelected}
                className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl border px-3 py-2 transition-colors ${
                  isSelected
                    ? "border-[#2B2B2B] bg-[#2B2B2B] text-[#F8F5F0]"
                    : slot.available
                      ? "border-[#EADDCD] bg-white text-[#2B2B2B] hover:border-[#B87B68] hover:text-[#B87B68] dark:border-[#4A4038] dark:bg-[#242220] dark:text-[#F0EDE8] dark:hover:border-[#D4B47A] dark:hover:text-[#D4B47A]"
                      : "cursor-not-allowed border-[#E5E1DC] bg-[#F0EEEB] text-[#8C7967] dark:border-[#3D3935] dark:bg-[#1A1814] dark:text-[#8A7D75]"
                }`}
              >
                <span
                  className={`text-sm font-bold ${
                    slot.available ? "" : "line-through"
                  }`}
                >
                  {slot.label}
                </span>
                <span
                  className={`mt-0.5 text-[10px] font-medium ${
                    isSelected
                      ? "text-[#EADDCD]"
                      : slot.available
                        ? "text-[#8C7967] dark:text-[#8A7D75]"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {slot.available ? `${slotDuration} min` : "Booked"}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
