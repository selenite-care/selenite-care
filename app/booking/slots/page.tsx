"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type SlotsResponse = {
  availableSlots: string[];
  bookedSlots: string[];
  error?: string;
};

type Doctor = {
  id: string;
  name: string;
  availability: string;
};

type DoctorsResponse = {
  doctors: Doctor[];
  error?: string;
};

const dayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getDayRange(start: number, end: number) {
  const days: number[] = [];
  let current = start;
  while (true) {
    days.push(current);
    if (current === end) break;
    current = (current + 1) % 7;
  }
  return days;
}

function parseAvailability(availability: string) {
  const match = availability.match(/^([A-Za-z]{3})–([A-Za-z]{3}),\s*(\d{1,2}(?:AM|PM))–(\d{1,2}(?:AM|PM))$/);
  if (!match) return null;

  const [, startDay, endDay] = match;
  const startDayIndex = dayMap[startDay as keyof typeof dayMap];
  const endDayIndex = dayMap[endDay as keyof typeof dayMap];

  if (startDayIndex === undefined || endDayIndex === undefined) {
    return null;
  }

  return {
    dayRange: getDayRange(startDayIndex, endDayIndex),
  };
}

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

function BookingSlotsPageContent() {
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
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(true);

  // Fetch doctor details
  useEffect(() => {
    if (!doctorId || !serviceId) {
      setDoctorLoading(false);
      return;
    }

    async function loadDoctor() {
      try {
        const response = await fetch(`/api/services/${encodeURIComponent(serviceId)}/doctors`);
        if (!response.ok) return;

        const data = (await response.json()) as DoctorsResponse;
        const foundDoctor = data.doctors?.find((d) => d.id === doctorId);
        if (foundDoctor) {
          setDoctor(foundDoctor);
        }
      } catch {
        // Silent fail - doctor details are optional
      } finally {
        setDoctorLoading(false);
      }
    }

    loadDoctor();
  }, [doctorId, serviceId]);

  const isDateOnWorkingDay = useMemo(() => {
    if (!doctor) return true;
    const parsed = parseAvailability(doctor.availability);
    if (!parsed) return true;
    
    const date = new Date(`${selectedDate}T00:00:00`);
    const dayIndex = date.getDay();
    
    return parsed.dayRange.includes(dayIndex);
  }, [selectedDate, doctor]);


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

    // Only load slots if on a working day
    if (isDateOnWorkingDay) {
      loadSlots();
    } else {
      setAvailableSlots([]);
      setBookedSlots([]);
      setIsLoading(false);
    }
  }, [doctorId, selectedDate, isDateOnWorkingDay]);

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
    <section style={{ backgroundColor: "#F8F5F0" }} className="flex min-h-screen flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              color: "#2B2B2B",
            }}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Select a Slot
          </h1>
          <p style={{ color: "#B8A89A" }} className="mt-4 text-base leading-7">
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
                <p style={{ color: "#B8A89A" }} className="text-sm font-medium">
                  Choose a date
                </p>
                <input
                  type="date"
                  style={{
                    borderColor: "#C6A56B",
                    color: "#2B2B2B",
                    backgroundColor: "#FFFFFF",
                  }}
                  className="mt-2 h-11 rounded-md border px-3 text-sm shadow-sm focus:outline-none focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                  value={selectedDate}
                  min={dateRange.min}
                  max={dateRange.max}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#D8C7B5",
                  borderWidth: "1px",
                }}
                className="rounded-lg p-4 text-sm shadow-sm"
              >
                <p style={{ color: "#2B2B2B" }} className="font-medium">
                  Selected Date
                </p>
                <p style={{ color: "#B8A89A" }} className="mt-2">
                  {selectedDate}
                </p>
              </div>
            </div>

            {isLoading ? (
              <p style={{ color: "#B8A89A" }} className="text-sm">
                Loading slots...
              </p>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {!isDateOnWorkingDay && !doctorLoading ? (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 text-sm text-orange-900">
                <p className="font-medium">
                  Dr. {doctor?.name ?? "Selected doctor"} is not available on this day. Please select a different date.
                </p>
              </div>
            ) : null}

            {isDateOnWorkingDay && (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {allSlots.length === 0 && !isLoading ? (
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#D8C7B5",
                      borderWidth: "1px",
                    }}
                    className="rounded-lg p-6 text-sm"
                  >
                    <p style={{ color: "#B8A89A" }}>No slots are available for this date.</p>
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
                        style={{
                          backgroundColor: isBooked
                            ? "#D8C7B5"
                            : isSelected
                            ? "#2B2B2B"
                            : "#F8F5F0",
                          borderColor: isBooked
                            ? "#D8C7B5"
                            : isSelected
                            ? "#2B2B2B"
                            : "#C6A56B",
                          color: isBooked
                            ? "#B8A89A"
                            : isSelected
                            ? "#F8F5F0"
                            : "#2B2B2B",
                          borderWidth: "2px",
                          cursor: isBooked ? "not-allowed" : "pointer",
                        }}
                        className="rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200"
                      >
                        <span>{formatTo12Hour(slot)}</span>
                        {isBooked ? (
                          <span style={{ color: "#B8A89A" }} className="mt-1 block text-xs">
                            Booked
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {selectedSlot && isDateOnWorkingDay ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p style={{ color: "#B8A89A" }} className="text-sm">
                    Selected slot:
                  </p>
                  <p style={{ color: "#2B2B2B" }} className="text-lg font-semibold">
                    {formatTo12Hour(selectedSlot)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleProceed}
                  style={{
                    backgroundColor: "#2B2B2B",
                    color: "#F8F5F0",
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors duration-200 hover:bg-[#B8A89A]"
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

function BookingSlotsLoadingFallback() {
  return (
    <section
      className="flex min-h-screen flex-col px-6 py-16"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-sm" style={{ color: "#B8A89A" }}>
          Loading...
        </p>
      </div>
    </section>
  );
}

export default function BookingSlotsPage() {
  return (
    <Suspense fallback={<BookingSlotsLoadingFallback />}>
      <BookingSlotsPageContent />
    </Suspense>
  );
}
