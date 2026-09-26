"use client";

import "react-phone-number-input/style.css";

import { Check, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import DoctorAvailabilityDatePicker from "@/components/consultations/DoctorAvailabilityDatePicker";
import { trackBeginCheckout } from "@/lib/analytics";

type ConsultationDoctor = {
  id: string;
  name: string;
  designation: string;
  availability: string;
  specialization: "AESTHETICIAN" | "NUTRITIONIST" | "PSYCHIATRIST";
};

type DoctorsResponse = {
  doctors?: ConsultationDoctor[];
  error?: string;
};

type BookingResponse = {
  redirectUrl?: string;
  error?: string;
};

const BENEFITS = [
  "Direct online doctor consultation",
  "Root cause identification and guidance",
  "Personalized product recommendations",
  "One complimentary follow-up session",
];
type OneTimeConsultationFormProps = {
  showPackageSummary?: boolean;
  price: number;
  isPricingLoading?: boolean;
};

export default function OneTimeConsultationForm({
  showPackageSummary = true,
  price,
  isPricingLoading = false,
}: OneTimeConsultationFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [doctors, setDoctors] = useState<ConsultationDoctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const selectedDoctor = doctors.find((doctor) => doctor.id === doctorId);

  useEffect(() => {
    let isMounted = true;

    async function loadDoctors() {
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
          setDoctorId((currentDoctorId) =>
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
  }, []);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !doctorId || !preferredDate) {
      setError("Please complete all required fields.");
      return;
    }

    if (!phone || !isValidPhoneNumber(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    trackBeginCheckout(
      [
        {
          id: "ONE_TIME_CONSULTATION",
          name: "Direct Consultation \u2014 Selenite Care",
          price,
          category: "Consultation",
          quantity: 1,
        },
      ],
      price,
    );
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/one-time-consultation/landing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          email: email.trim(),
          doctorId,
          preferredDate,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | BookingResponse
        | null;

      if (!response.ok || !data?.redirectUrl) {
        throw new Error(data?.error ?? "Unable to start payment.");
      }

      window.location.href = data.redirectUrl;
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to start payment.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <section className="h-full w-full max-w-xl overflow-hidden rounded-lg border border-[#D4B47A] bg-white shadow-sm dark:bg-[#1F1B18]">
      {showPackageSummary ? (
        <header className="bg-gradient-to-br from-[#E4C98D] via-[#D4B47A] to-[#B89047] px-5 py-5 text-[#2B2B2B] sm:px-6">
          <p className="text-xs font-semibold uppercase">One-Time Package</p>
          <h2
            className="mt-2 text-2xl font-semibold"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Direct Consultation {"\u2014"} {price.toLocaleString("en-US")} BDT
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2 text-xs leading-5"
              >
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </header>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
        {!showPackageSummary ? (
          <div>
            <p className="text-xs font-semibold uppercase text-[#B89047]">
              Reserve Your Slot
            </p>
            <h3
              className="mt-1 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Book Your Consultation
            </h3>
          </div>
        ) : null}
        <div>
          <label
            htmlFor="consultation-name"
            className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
          >
            Full Name
          </label>
          <input
            id="consultation-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#A69789] focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#141210] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label
            htmlFor="consultation-phone"
            className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
          >
            Phone Number
          </label>
          <div className="one-time-consultation-phone mt-2">
            <PhoneInput
              id="consultation-phone"
              defaultCountry="BD"
              international
              countryCallingCodeEditable={false}
              value={phone}
              onChange={setPhone}
              placeholder="Your phone number"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="consultation-email"
            className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
          >
            Email Address
          </label>
          <input
            id="consultation-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#A69789] focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#141210] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="consultation-doctor"
            className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
          >
            Select Doctor
          </label>
          <select
            id="consultation-doctor"
            value={doctorId}
            onChange={(event) => {
              setDoctorId(event.target.value);
              setPreferredDate("");
              setError("");
            }}
            required
            disabled={isLoadingDoctors || doctors.length === 0}
            className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#3D3530] dark:bg-[#141210] dark:text-[#F0EDE8]"
          >
            <option value="">
              {isLoadingDoctors
                ? "Loading doctors..."
                : doctors.length === 0
                  ? "No doctors available"
                  : "Choose a doctor"}
            </option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} - {doctor.designation}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="consultation-date"
            className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
          >
            Preferred Date
          </label>
          <DoctorAvailabilityDatePicker
            id="consultation-date"
            availability={selectedDoctor?.availability}
            value={preferredDate}
            onChange={(date) => {
              setPreferredDate(date);
              setError("");
            }}
            className="mt-2"
          />
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={
            isSubmitting ||
            isPricingLoading ||
            isLoadingDoctors ||
            doctors.length === 0
          }
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-5 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#F0EDE8] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Starting Payment...
            </>
          ) : isPricingLoading ? (
            <span className="h-4 w-40 animate-pulse rounded bg-white/25" />
          ) : (
            `Book Now \u2014 ${price.toLocaleString("en-US")} BDT`
          )}
        </button>

        <p className="text-center text-xs leading-5 text-[#6E6257] dark:text-[#B8AAA0]">
          Our team will call you to confirm the consultation time. No
          registration required.
        </p>
      </form>

      <style>{`
        .one-time-consultation-phone .PhoneInput {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 44px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid #EADDCD;
          background-color: #FFFFFF;
          padding: 0 12px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .one-time-consultation-phone .PhoneInput:focus-within {
          border-color: #B87B68;
          box-shadow: 0 0 0 1px #B87B68;
        }

        .one-time-consultation-phone .PhoneInputCountry {
          margin-right: 0;
        }

        .one-time-consultation-phone .PhoneInputCountrySelect {
          cursor: pointer;
        }

        .one-time-consultation-phone .PhoneInputCountryIcon {
          box-shadow: none;
        }

        .one-time-consultation-phone .PhoneInputCountrySelectArrow {
          color: #8C7967;
          opacity: 1;
        }

        .one-time-consultation-phone .PhoneInputInput {
          height: 100%;
          width: 100%;
          border: 0;
          background: transparent;
          color: #2B2B2B;
          font-size: 14px;
          outline: none;
          box-shadow: none;
        }

        .one-time-consultation-phone .PhoneInputInput::placeholder {
          color: #A69789;
        }

        .dark .one-time-consultation-phone .PhoneInput {
          border-color: #3D3530;
          background-color: #141210;
        }

        .dark .one-time-consultation-phone .PhoneInputCountrySelectArrow {
          color: #8A7D75;
        }

        .dark .one-time-consultation-phone .PhoneInputInput {
          color: #F0EDE8;
        }

        .dark .one-time-consultation-phone .PhoneInputInput::placeholder {
          color: #8A7D75;
        }
      `}</style>
    </section>
  );
}
