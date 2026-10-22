"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TimeSlotSelector from "@/components/consultations/TimeSlotSelector";
import DoctorPhoto from "@/components/ui/DoctorPhoto";
import { formatFullDate } from "@/lib/dateUtils";
import {
  dayOrder,
  formatAvailabilityDateLabel,
  parseAvailabilityEndTime,
  parseAvailableDays,
  toDateInputValue,
} from "@/lib/doctorAvailability";

type AppointmentDoctor = {
  id: string;
  name: string;
  designation: string;
  bio: string | null;
  availability: string;
  image: string | null;
};

type DoctorResponse = {
  doctor?: AppointmentDoctor;
  error?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AppointmentDatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId") ?? "";

  const [doctor, setDoctor] = useState<AppointmentDoctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [scheduleStep, setScheduleStep] = useState<"date" | "time">("date");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDoctor() {
      if (!doctorId) {
        setError("Doctor ID is required.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/appointment/doctors/${encodeURIComponent(doctorId)}`,
        );
        const data = (await response.json().catch(() => null)) as
          | DoctorResponse
          | null;

        if (!response.ok || !data?.doctor) {
          throw new Error(data?.error ?? "Unable to load doctor details.");
        }

        if (isMounted) {
          setDoctor(data.doctor);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load doctor details.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDoctor();

    return () => {
      isMounted = false;
    };
  }, [doctorId]);

  const availableDays = useMemo(
    () => (doctor ? parseAvailableDays(doctor.availability) : new Set<number>()),
    [doctor],
  );

  const sameDayCutoff = useMemo(() => {
    if (!doctor) {
      return null;
    }

    const endTime = parseAvailabilityEndTime(doctor.availability);

    if (!endTime) {
      return null;
    }

    const now = new Date();
    const todayDayIndex = now.getDay();

    if (!availableDays.has(todayDayIndex)) {
      return null;
    }

    const cutoffMinutes = endTime.hours24 * 60 + endTime.minutes - 120;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (currentMinutes < cutoffMinutes) {
      return null;
    }

    return {
      todayValue: toDateInputValue(now),
      endTimeLabel: endTime.endTimeLabel,
    };
  }, [availableDays, doctor]);

  const dateOptions = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 30 }, (_, offset) => {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);

      return {
        value: toDateInputValue(date),
        label: formatAvailabilityDateLabel(date),
        isAvailable:
          availableDays.has(date.getDay()) &&
          sameDayCutoff?.todayValue !== toDateInputValue(date),
      };
    });
  }, [availableDays, sameDayCutoff]);

  function handleConfirm() {
    if (!doctorId || !selectedDate || !selectedTimeSlot) {
      return;
    }

    router.push(
      `/appointment/survey?doctorId=${encodeURIComponent(
        doctorId,
      )}&date=${encodeURIComponent(selectedDate)}&timeSlot=${encodeURIComponent(
        selectedTimeSlot,
      )}`,
    );
  }

  function handleDateSelection(dateValue: string) {
    setSelectedDate(dateValue);
    setSelectedTimeSlot("");
    setScheduleStep("time");
  }

  function returnToDateStep() {
    setScheduleStep("date");
    setSelectedDate("");
    setSelectedTimeSlot("");
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <h1
            className="text-4xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Choose Appointment Date
          </h1>
          <p
            className="mt-5 text-base leading-8 text-[#6E6257] dark:text-[#8A7D75] sm:text-lg"
          >
            Select a preferred date within the next 30 days based on your
            doctor&apos;s schedule.
          </p>
        </div>

        {isLoading ? (
          <p className="mt-10 text-sm text-[#884F38] dark:text-[#8A7D75]">
            Loading doctor details...
          </p>
        ) : null}

        {error ? (
          <div
            className="mt-10 rounded-2xl border px-5 py-4 text-sm text-red-600"
            style={{ borderColor: "#F0C9C9", backgroundColor: "#FFF6F6" }}
          >
            {error}
          </div>
        ) : null}

        {!isLoading && !error && doctor ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
            <section
              className="overflow-hidden rounded-[24px] border bg-white dark:bg-[#242220] dark:border-[#3D3530]"
              style={{
                borderColor: "#EADDCD",
                boxShadow: "0 18px 48px rgba(43, 43, 43, 0.06)",
              }}
            >
              {doctor.image ? (
                <div className="h-72 w-full bg-[#EFE7DC]">
                  <DoctorPhoto
                    src={doctor.image}
                    alt={doctor.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="flex h-72 w-full items-center justify-center dark:bg-[#2B2724]"
                  style={{ backgroundColor: "#E8DDD3" }}
                >
                  <span
                    className="text-4xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  >
                    {getInitials(doctor.name)}
                  </span>
                </div>
              )}

              <div className="p-6">
                <h2
                  className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  {doctor.name}
                </h2>
                <p className="mt-2 text-sm font-medium text-[#8C7967] dark:text-[#8A7D75]">
                  {doctor.designation}
                </p>
                <p className="mt-4 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]">
                  {doctor.bio ?? "Doctor profile coming soon."}
                </p>

                <div
                  className="mt-5 rounded-xl border px-4 py-3 text-sm dark:bg-[#1A1814] dark:border-[#3D3530] dark:text-[#8A7D75]"
                  style={{
                    borderColor: "#EADDCD",
                    backgroundColor: "#F8F5F0",
                    color: "#6E6257",
                  }}
                >
                  <span className="font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Availability:
                  </span>{" "}
                  {doctor.availability}
                </div>
              </div>
            </section>

            <section
              className="rounded-[24px] border bg-white p-6 dark:bg-[#242220] dark:border-[#3D3530] sm:p-8"
              style={{
                borderColor: "#EADDCD",
                boxShadow: "0 18px 48px rgba(43, 43, 43, 0.06)",
              }}
            >
              {scheduleStep === "date" ? (
                <div className="animate-[fadeIn_0.25s_ease]">
                  <p className="text-xs font-semibold uppercase text-[#B87B68] dark:text-[#D4B47A]">
                    Step 1 of 2 {"\u2014"} Select Your Date
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                        Available Dates
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]">
                        Only the highlighted weekdays can be selected.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {dayOrder.map((day, index) => {
                        const isEnabled = availableDays.has(index);

                        return (
                          <span
                            key={day}
                            className="rounded-full border px-3 py-1 text-xs font-medium"
                            style={{
                              borderColor: isEnabled ? "#B87B68" : "#EADDCD",
                              backgroundColor: isEnabled ? "#B87B68" : "#F8F5F0",
                              color: isEnabled ? "#F8F5F0" : "#8C7967",
                            }}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                    {dateOptions.map((dateOption) => (
                      <button
                        key={dateOption.value}
                        type="button"
                        disabled={!dateOption.isAvailable}
                        onClick={() => handleDateSelection(dateOption.value)}
                        className="min-h-[72px] rounded-xl border px-3 py-4 text-sm font-medium transition-colors"
                        style={{
                          borderColor: dateOption.isAvailable
                            ? "#EADDCD"
                            : "#E8DDD3",
                          backgroundColor: dateOption.isAvailable
                            ? "#FFFFFF"
                            : "#F8F5F0",
                          color: dateOption.isAvailable ? "#2B2B2B" : "#884F38",
                          opacity: dateOption.isAvailable ? 1 : 0.55,
                          cursor: dateOption.isAvailable ? "pointer" : "not-allowed",
                        }}
                      >
                        {dateOption.label}
                      </button>
                    ))}
                  </div>

                  {sameDayCutoff ? (
                    <div className="mt-5 rounded-xl border border-[#EADDCD] bg-[#F8F5F0] px-4 py-3 dark:border-[#3D3530] dark:bg-[#1A1814]">
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#B87B68]"
                          aria-hidden="true"
                        />
                        <p className="text-sm leading-6 text-[#8C7967] dark:text-[#8A7D75]">
                          Same-day booking is no longer available for today.{" "}
                          <span className="font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                            {doctor.name}
                          </span>{" "}
                          is available until {sameDayCutoff.endTimeLabel} and
                          bookings close 2 hours before. Please select a future
                          date.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="animate-[fadeIn_0.25s_ease]">
                  <button
                    type="button"
                    onClick={returnToDateStep}
                    className="flex items-center gap-3 text-left text-sm font-medium text-[#2B2B2B] hover:text-[#B87B68] dark:text-[#F0EDE8] dark:hover:text-[#D4B47A]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EADDCD] bg-white dark:border-[#3D3530] dark:bg-[#1A1814]">
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span>{formatFullDate(selectedDate)}</span>
                  </button>
                  <p className="mt-6 text-xs font-semibold uppercase text-[#B87B68] dark:text-[#D4B47A]">
                    Step 2 of 2 {"\u2014"} Select Your Time
                  </p>
                  <TimeSlotSelector
                    doctorId={doctorId}
                    date={selectedDate}
                    value={selectedTimeSlot}
                    onChange={setSelectedTimeSlot}
                    showHeading={false}
                  />

                  {selectedTimeSlot ? (
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] hover:bg-[#884F38] dark:bg-[#F0EDE8] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
                    >
                      Continue to Appointment Survey
                    </button>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function AppointmentDateLoadingFallback() {
  return (
    <section className="flex min-h-screen flex-col bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-sm text-[#884F38] dark:text-[#8A7D75]">
          Loading...
        </p>
      </div>
    </section>
  );
}

export default function AppointmentDatePage() {
  return (
    <Suspense fallback={<AppointmentDateLoadingFallback />}>
      <AppointmentDatePageContent />
    </Suspense>
  );
}
