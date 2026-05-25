"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type SlotsResponse = {
  availableSlots: string[];
  bookedSlots: string[];
  error?: string;
};

function formatDateInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function getDateRange() {
  const today = new Date();
  const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    min: formatDateInput(today),
    max: formatDateInput(maxDate),
  };
}
 function formatTo12Hour(time: string): string {
  const [hourStr, minuteStr] = time.split(":")
  const hour = parseInt(hourStr)
  const minute = minuteStr
  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute} ${period}`
}

export default function BookingSlotsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const doctorId = searchParams.get("doctorId") ?? "";
  const serviceId = searchParams.get("serviceId") ?? "";
  const dateRange = useMemo(() => getDateRange(), []);

  const [selectedDate, setSelectedDate] = useState<string>(dateRange.min);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!doctorId) return;
    if (!selectedDate) return;

    async function loadSlots() {
      setIsLoading(true);
      setError("");
      setSelectedSlot("");

      try {
        const response = await fetch(
          `/api/booking/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(selectedDate)}`,
        );

        const data = (await response.json()) as SlotsResponse;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load slots.");
        }

        setAvailableSlots(data.availableSlots ?? []);
        setBookedSlots(data.bookedSlots ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load slots.");
        setAvailableSlots([]);
        setBookedSlots([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadSlots();
  }, [doctorId, selectedDate]);

  function handleProceed() {
    if (!selectedSlot) return;
    router.push(
      `/booking/survey?serviceId=${encodeURIComponent(serviceId)}&doctorId=${encodeURIComponent(doctorId)}&slot=${encodeURIComponent(selectedSlot)}&date=${encodeURIComponent(selectedDate)}`,
    );
  }

  const allSlots = useMemo(() => {
    const result = [...availableSlots, ...bookedSlots];
    result.sort();
    return result;
  }, [availableSlots, bookedSlots]);

  return (
    <section className="flex min-h-screen flex-col bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Select a Slot
          </h1>
          <p className="mt-4 text-base leading-7 text-foreground/70">
            Pick a date and time for your appointment. Booked slots are disabled.
          </p>
        </div>

        {!doctorId || !serviceId ? (
          <div className="mt-10 rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Doctor ID and service ID are required query parameters.
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">Choose a date</p>
                <input
                  type="date"
                  className="mt-2 h-11 rounded-md border border-black/10 bg-background px-3 text-sm text-foreground shadow-sm focus:border-foreground/70 focus:outline-none"
                  value={selectedDate}
                  min={dateRange.min}
                  max={dateRange.max}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>

              <div className="rounded-lg border border-black/10 bg-background p-4 text-sm text-foreground/70 shadow-sm">
                <p className="font-medium text-foreground">Selected Date</p>
                <p className="mt-2">{selectedDate}</p>
              </div>
            </div>

            {isLoading ? (
              <p className="text-sm text-foreground/70">Loading slots...</p>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {allSlots.length === 0 && !isLoading ? (
                <div className="rounded-lg border border-black/10 bg-background p-6 text-sm text-foreground/70">
                  No slots are available for this date.
                </div>
              ) : (
                allSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => !isBooked && setSelectedSlot(slot)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                        isBooked
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
                          : isSelected
                          ? "border-emerald-700 bg-emerald-600 text-white shadow-sm"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100"
                      }`}
                    >
                      <span>{formatTo12Hour(slot)}</span>
                      {isBooked ? <span className="mt-1 block text-xs text-foreground/60">Booked</span> : null}
                    </button>
                  );
                })
              )}
            </div>

            {selectedSlot ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-foreground/70">Selected slot:</p>
                  <p className="text-lg font-semibold text-foreground">{formatTo12Hour(selectedSlot)}</p>
                </div>
                <button
                  type="button"
                  onClick={handleProceed}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                >
                  Proceed to Survey
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
