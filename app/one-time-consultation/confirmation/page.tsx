"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { trackPurchase } from "@/lib/analytics";
import { formatDateOnly } from "@/lib/dateUtils";

const PACKAGE_PRICE = 99;

type ConfirmationDetails = {
  bookingId: string;
  token: string;
  doctorName: string;
  preferredDate: string | null;
  email: string;
  hasTemporaryCredentials: boolean;
};

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId")?.trim() ?? "";
  const [details, setDetails] = useState<ConfirmationDetails | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const hasTrackedPurchase = useRef(false);

  useEffect(() => {
    if (!bookingId || hasTrackedPurchase.current) {
      return;
    }

    trackPurchase(
      bookingId,
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
    hasTrackedPurchase.current = true;
  }, [bookingId]);

  useEffect(() => {
    let isMounted = true;

    async function loadBooking() {
      if (!bookingId) {
        setError("Booking details are unavailable.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/one-time-consultation/confirmation?bookingId=${encodeURIComponent(bookingId)}`,
          { cache: "no-store" },
        );
        const data = (await response.json().catch(() => null)) as
          | (ConfirmationDetails & { error?: string })
          | null;

        if (!response.ok || !data?.token) {
          throw new Error(data?.error ?? "Unable to load booking details.");
        }

        if (isMounted) setDetails(data);
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load booking details.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadBooking();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0] px-4 dark:bg-[#141210]">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-[#D4B47A]/30" />
          <p className="mt-4 text-sm text-[#6E6257] dark:text-[#B8AAA0]">
            Loading your booking confirmation...
          </p>
        </div>
      </main>
    );
  }

  if (error || !details) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0] px-4 dark:bg-[#141210]">
        <div className="w-full max-w-lg text-center">
          <h1 className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
            We could not load this confirmation
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6E6257] dark:text-[#B8AAA0]">
            {error || "Please check the confirmation link and try again."}
          </p>
          <Link
            href="/one-time-consultation"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] dark:bg-[#D4B47A] dark:text-[#141210]"
          >
            Return to consultation page
          </Link>
        </div>
      </main>
    );
  }

  const nextSteps = [
    "Our team will call you within 24 hours to confirm your consultation time.",
    "You will receive a Google Meet link before your consultation.",
    "Join the consultation at the confirmed time.",
  ];

  return (
    <main className="min-h-screen bg-[#F8F5F0] px-4 py-12 text-[#2B2B2B] dark:bg-[#141210] dark:text-[#F0EDE8] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="text-center">
          <CheckCircle2
            className="mx-auto h-20 w-20 text-[#C4A56B]"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <h1
            className="mt-5 text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Consultation Booked Successfully!
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6E6257] dark:text-[#B8AAA0]">
            Your payment is confirmed. Our team will arrange the exact time with
            you shortly.
          </p>
        </header>

        <section className="mt-8 border-y border-[#D4B47A]/60 py-6">
          <div className="grid gap-6 text-center sm:grid-cols-3 sm:text-left">
            <div>
              <p className="text-xs font-semibold uppercase text-[#8C7967] dark:text-[#8A7D75]">
                Booking Token
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold text-[#B28A3E] dark:text-[#F3DFA6]">
                {details.token}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#8C7967] dark:text-[#8A7D75]">
                Doctor
              </p>
              <p className="mt-2 text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                {details.doctorName}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#8C7967] dark:text-[#8A7D75]">
                Preferred Date
              </p>
              <p className="mt-2 text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                {formatDateOnly(details.preferredDate)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#1F1B18]">
          <h2
            className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            What happens next?
          </h2>
          <ol className="mt-6 space-y-5">
            {nextSteps.map((step, index) => (
              <li key={step} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4B47A] text-sm font-semibold text-[#2B2B2B]">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-6 text-[#5F524A] dark:text-[#D9C9BD]">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 rounded-lg border border-[#D4B47A] bg-[#FFF8E6] p-6 dark:bg-[#33291C]">
          <h2 className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
            Questions? Contact us: +8801647660300
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a
              href="tel:+8801647660300"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-4 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#884F38]"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call Now
            </a>
            <a
              href="https://wa.me/8801647660300"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-sm font-semibold text-[#102A18] transition-colors hover:bg-[#20BD5A]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </section>

        {details.hasTemporaryCredentials ? (
          <section className="mt-6 rounded-lg border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#1F1B18]">
            <div className="flex items-start gap-4">
              <KeyRound
                className="mt-0.5 h-6 w-6 shrink-0 text-[#C4A56B]"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <h2
                  className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  We created an account for you
                </h2>
                <p className="mt-2 break-all text-sm text-[#6E6257] dark:text-[#B8AAA0]">
                  {details.email}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6E6257] dark:text-[#B8AAA0]">
                  Your temporary login credentials were sent by email. Set a
                  private password before signing in.
                </p>
                <Link
                  href="/forgot-password"
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#D4B47A] px-4 text-sm font-semibold text-[#2B2B2B] transition-colors hover:bg-[#FFF8E6] dark:text-[#F0EDE8] dark:hover:bg-[#33291C]"
                >
                  Set Your Password
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default function OneTimeConsultationConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8F5F0] dark:bg-[#141210]" />
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
