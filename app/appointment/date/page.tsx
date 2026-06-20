"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function parseAvailableDays(availability: string) {
  const allowed = new Set<number>();
  const normalizedAvailability = availability
    .replaceAll("Ã¢â‚¬â€œ", "–")
    .replaceAll("â€“", "–")
    .replaceAll("—", "–")
    .trim();
  const segments = normalizedAvailability
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const timeSegmentIndex = [...segments]
    .reverse()
    .findIndex(
      (segment) => /(?:AM|PM)/i.test(segment) && segment.includes("–"),
    );

  const daySegments =
    timeSegmentIndex === -1
      ? segments
      : segments.slice(0, segments.length - timeSegmentIndex - 1);

  for (const segment of daySegments) {
    const compactSegment = segment.replace(/\s+/g, "");

    if (!compactSegment) {
      continue;
    }

    if (compactSegment.includes("–")) {
      const [startDay, endDay] = compactSegment.split("–");
      const startIndex = dayOrder.indexOf(startDay);
      const endIndex = dayOrder.indexOf(endDay ?? startDay);

      if (startIndex === -1) {
        continue;
      }

      if (endIndex === -1 || startIndex === endIndex) {
        allowed.add(startIndex);
        continue;
      }

      if (startIndex < endIndex) {
        for (let index = startIndex; index <= endIndex; index += 1) {
          allowed.add(index);
        }
      } else {
        for (let index = startIndex; index < dayOrder.length; index += 1) {
          allowed.add(index);
        }

        for (let index = 0; index <= endIndex; index += 1) {
          allowed.add(index);
        }
      }

      continue;
    }

    const dayIndex = dayOrder.indexOf(compactSegment);

    if (dayIndex !== -1) {
      allowed.add(dayIndex);
    }
  }

  return allowed;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function AppointmentDatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId") ?? "";

  const [doctor, setDoctor] = useState<AppointmentDoctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
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

    loadDoctor();

    return () => {
      isMounted = false;
    };
  }, [doctorId]);

  const availableDays = useMemo(
    () => (doctor ? parseAvailableDays(doctor.availability) : new Set<number>()),
    [doctor],
  );

  const dateOptions = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 30 }, (_, offset) => {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);

      return {
        value: toDateInputValue(date),
        label: formatDateLabel(date),
        isAvailable: availableDays.has(date.getDay()),
      };
    });
  }, [availableDays]);

  function handleConfirm() {
    if (!doctorId || !selectedDate) {
      return;
    }

    router.push(
      `/appointment/survey?doctorId=${encodeURIComponent(
        doctorId,
      )}&date=${encodeURIComponent(selectedDate)}`,
    );
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
          <p className="mt-10 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
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
                borderColor: "#D8C7B5",
                boxShadow: "0 18px 48px rgba(43, 43, 43, 0.06)",
              }}
            >
              {doctor.image ? (
                <div className="relative h-72 w-full bg-[#EFE7DC]">
                  <Image
                    src={doctor.image}
                    alt={doctor.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 320px"
                    className="object-cover"
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
                    borderColor: "#D8C7B5",
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
                borderColor: "#D8C7B5",
                boxShadow: "0 18px 48px rgba(43, 43, 43, 0.06)",
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2
                    className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{
                      fontFamily: "Playfair Display, serif",
                    }}
                  >
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
                          borderColor: isEnabled ? "#C6A56B" : "#D8C7B5",
                          backgroundColor: isEnabled ? "#C6A56B" : "#F8F5F0",
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
                {dateOptions.map((dateOption) => {
                  const isSelected = selectedDate === dateOption.value;

                  return (
                    <button
                      key={dateOption.value}
                      type="button"
                      disabled={!dateOption.isAvailable}
                      onClick={() => setSelectedDate(dateOption.value)}
                      className="min-h-[72px] rounded-xl border px-3 py-4 text-sm font-medium transition-all"
                      style={{
                        borderColor: isSelected
                          ? "#C6A56B"
                          : dateOption.isAvailable
                            ? "#D8C7B5"
                            : "#E8DDD3",
                        backgroundColor: isSelected
                          ? "#2B2B2B"
                          : dateOption.isAvailable
                            ? "#FFFFFF"
                            : "#F8F5F0",
                        color: isSelected
                          ? "#F8F5F0"
                          : dateOption.isAvailable
                            ? "#2B2B2B"
                            : "#B8A89A",
                        opacity: dateOption.isAvailable ? 1 : 0.55,
                        cursor: dateOption.isAvailable ? "pointer" : "not-allowed",
                      }}
                    >
                      {dateOption.label}
                    </button>
                  );
                })}
              </div>

              <div
                className="mt-8 rounded-xl border px-4 py-3 text-sm dark:bg-[#1A1814] dark:border-[#3D3530] dark:text-[#8A7D75]"
                style={{
                  borderColor: "#D8C7B5",
                  backgroundColor: "#F8F5F0",
                  color: "#6E6257",
                }}
              >
                <span className="font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Selected Date:
                </span>{" "}
                {selectedDate
                  ? new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "No date selected yet"}
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedDate}
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:bg-[#B8A89A] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: "#2B2B2B",
                  color: "#F8F5F0",
                }}
              >
                Confirm Appointment Date
              </button>
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
        <p className="text-sm text-[#B8A89A] dark:text-[#8A7D75]">
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
