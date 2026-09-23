"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import DoctorAvailabilityDatePicker from "@/components/consultations/DoctorAvailabilityDatePicker";
import DoctorPhoto from "@/components/ui/DoctorPhoto";
import { trackBeginCheckout } from "@/lib/analytics";

type ConsultationDoctor = {
  id: string;
  name: string;
  designation: string;
  availability: string;
  bio: string | null;
  image: string | null;
  specialization: "AESTHETICIAN" | "NUTRITIONIST" | "PSYCHIATRIST";
};

type DoctorsResponse = {
  doctors?: ConsultationDoctor[];
  error?: string;
};

type InitiateResponse = {
  redirectUrl?: string;
  error?: string;
};

const PACKAGE_PRICE = 99;
const PACKAGE_BENEFITS = [
  "Direct online doctor consultation",
  "Root cause identification and guidance",
  "Personalized product recommendations",
  "One complimentary follow-up session",
];

const SPECIALIZATION_LABELS: Record<
  ConsultationDoctor["specialization"],
  string
> = {
  AESTHETICIAN: "Aesthetician",
  NUTRITIONIST: "Nutritionist",
  PSYCHIATRIST: "Psychiatrist",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function OneTimeConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [doctors, setDoctors] = useState<ConsultationDoctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(
    searchParams.get("error") === "payment_failed"
      ? "Payment was not completed. No booking was created. Please try again when you are ready."
      : "",
  );
  const selectedDoctor = doctors.find(
    (doctor) => doctor.id === selectedDoctorId,
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(
        `/login?callbackUrl=${encodeURIComponent("/one-time-consultation")}`,
      );
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let isMounted = true;

    async function loadDoctors() {
      setIsLoadingDoctors(true);

      try {
        const response = await fetch("/api/appointment/doctors", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | DoctorsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load doctors.");
        }

        if (isMounted) {
          const loadedDoctors = data?.doctors ?? [];
          setDoctors(loadedDoctors);
          setSelectedDoctorId((currentDoctorId) =>
            currentDoctorId || loadedDoctors[0]?.id || "",
          );
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load doctors.",
          );
        }
      } finally {
        if (isMounted) setIsLoadingDoctors(false);
      }
    }

    void loadDoctors();

    return () => {
      isMounted = false;
    };
  }, [status]);

  useEffect(() => {
    function resetSubmitting() {
      setIsSubmitting(false);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") resetSubmitting();
    }

    window.addEventListener("pageshow", resetSubmitting);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", resetSubmitting);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function handlePayment() {
    if (!selectedDoctorId || !preferredDate || isSubmitting) return;

    trackBeginCheckout(
      [
        {
          id: "ONE_TIME_CONSULTATION",
          name: "Direct Consultation \u2014 Selenite Care",
          price: PACKAGE_PRICE,
          category: "Consultation",
          quantity: 1,
        },
      ],
      PACKAGE_PRICE,
    );
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/one-time-consultation/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          preferredDate,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | InitiateResponse
        | null;

      if (response.status === 401) {
        router.replace(
          `/login?callbackUrl=${encodeURIComponent("/one-time-consultation")}`,
        );
        return;
      }

      if (!response.ok || !data?.redirectUrl) {
        throw new Error(data?.error ?? "Unable to start payment.");
      }

      window.location.href = data.redirectUrl;
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Unable to start payment.",
      );
      setIsSubmitting(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0] dark:bg-[#141210]">
        <Loader2 className="h-7 w-7 animate-spin text-[#C4A56B]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0] px-4 py-10 text-[#2B2B2B] dark:bg-[#141210] dark:text-[#F0EDE8] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <section className="overflow-hidden rounded-lg border border-[#B87B68] bg-gradient-to-br from-[#FFF8F6] via-[#F4E3DE] to-[#D9ADA0] p-4 shadow-sm dark:from-[#1F1B18] dark:via-[#30231F] dark:to-[#4A2F28] sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#884F38] dark:text-[#D9A694]">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-[11px] font-semibold uppercase">
                  One-Time Consultation
                </span>
              </div>
              <h1
                className="mt-2 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-3xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Direct Consultation
              </h1>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase text-[#8C7967] dark:text-[#B8AAA0]">
                One-time
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#884F38] dark:text-[#D9A694] sm:text-3xl">
                {PACKAGE_PRICE} BDT
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#B87B68]/50 pt-4">
            {PACKAGE_BENEFITS.map((benefit) => (
              <div key={benefit} className="flex min-w-0 items-start gap-2">
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#884F38] dark:text-[#D9A694]"
                  aria-hidden="true"
                />
                <p className="text-xs leading-5 text-[#5F524A] dark:text-[#D9C9BD]">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div>
            <h2
              className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-3xl"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Choose Your Doctor
            </h2>
            <p className="mt-2 text-sm text-[#6E6257] dark:text-[#B8AAA0]">
              Select the specialist you would like to consult with.
            </p>
          </div>

          {isLoadingDoctors ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[4/3] animate-pulse rounded-lg bg-[#EADDCD]/60 dark:bg-[#2A2521]"
                />
              ))}
            </div>
          ) : null}

          {!isLoadingDoctors && doctors.length === 0 ? (
            <p className="mt-6 rounded-lg border border-[#EADDCD] bg-white p-5 text-sm text-[#6E6257] dark:border-[#3D3530] dark:bg-[#1F1B18] dark:text-[#B8AAA0]">
              No doctors are available right now.
            </p>
          ) : null}

          {!isLoadingDoctors && doctors.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => {
                const isSelected = selectedDoctorId === doctor.id;

                return (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => {
                      setSelectedDoctorId(doctor.id);
                      setPreferredDate("");
                      setError("");
                    }}
                    className={`relative flex min-w-0 overflow-hidden rounded-lg border-2 bg-white text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87B68] dark:bg-[#1F1B18] sm:block ${
                      isSelected
                        ? "border-[#C4A56B]"
                        : "border-[#EADDCD] hover:border-[#D4B47A] dark:border-[#3D3530]"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-[#E8DDD3] dark:bg-[#2A2521] sm:h-auto sm:w-full sm:aspect-[4/3]">
                      {doctor.image ? (
                        <DoctorPhoto
                          src={doctor.image}
                          alt={doctor.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl font-semibold text-[#884F38] dark:text-[#F3DFA6]">
                          {getInitials(doctor.name)}
                        </div>
                      )}
                      {isSelected ? (
                        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#D4B47A] text-[#2B2B2B] shadow-sm sm:right-3 sm:top-3 sm:h-9 sm:w-9">
                          <CheckCircle2
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            aria-hidden="true"
                          />
                        </span>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:block sm:p-5">
                      <span className="inline-flex self-start rounded-full border border-[#D4B47A]/70 bg-[#FFF8E6] px-2.5 py-1 text-xs font-semibold text-[#8A641D] dark:bg-[#33291C] dark:text-[#F3DFA6]">
                        {SPECIALIZATION_LABELS[doctor.specialization]}
                      </span>
                      <h3
                        className="mt-2 text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:mt-3 sm:text-xl"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        {doctor.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#6E6257] dark:text-[#B8AAA0]">
                        {doctor.designation}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="mt-10 border-t border-[#EADDCD] pt-8 dark:border-[#3D3530]">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-end">
            <div>
              <h2
                className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-3xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Preferred Consultation Date
              </h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-[#6E6257] dark:text-[#B8AAA0]">
                <CalendarDays
                  className="h-4 w-4 text-[#C4A56B]"
                  aria-hidden="true"
                />
                Our team will confirm the exact time via phone.
              </p>
            </div>

            <div>
              <label
                htmlFor="preferred-consultation-date"
                className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
              >
                Select a date
              </label>
              <DoctorAvailabilityDatePicker
                id="preferred-consultation-date"
                availability={selectedDoctor?.availability}
                value={preferredDate}
                onChange={(date) => {
                  setPreferredDate(date);
                  setError("");
                }}
                className="mt-2"
              />
            </div>
          </div>
        </section>

        {error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void handlePayment()}
          disabled={!selectedDoctorId || !preferredDate || isSubmitting}
          className="mt-8 inline-flex h-13 w-full items-center justify-center gap-2 rounded-md bg-[#B87B68] px-6 text-base font-semibold text-[#2B2B2B] transition-colors hover:bg-[#C4A56B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Starting Payment...
            </>
          ) : (
            `${PACKAGE_PRICE} BDT - Proceed to Payment`
          )}
        </button>
      </div>
    </main>
  );
}

export default function OneTimeConsultationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8F5F0] dark:bg-[#141210]" />
      }
    >
      <OneTimeConsultationContent />
    </Suspense>
  );
}
