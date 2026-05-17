"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? searchParams.get("bookingId");

  return (
    <section className="flex flex-1 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-lg border border-black/10 bg-background p-8 dark:border-white/10">
          <p className="text-sm font-medium uppercase text-foreground/60">
            Booking Confirmed
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your consultation is booked.
          </h1>
          <p className="mt-4 text-base leading-7 text-foreground/70">
            Thank you for choosing Selenite Care. Please check your email for
            your appointment details and any preparation notes.
          </p>

          <div className="mt-8 rounded-md border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium text-foreground">
              Unique Booking Token
            </p>
            <p className="mt-2 break-all font-mono text-sm text-foreground/70">
              {token ?? "Your booking token will appear in your confirmation email."}
            </p>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">
              What Happens Next
            </h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-foreground/70">
              <li>1. We review your consultation form before your session.</li>
              <li>2. You receive confirmation and next steps by email.</li>
              <li>3. Your consultant meets with you at the scheduled time.</li>
            </ol>
          </div>

          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <section className="flex flex-1 bg-zinc-50 px-6 py-16 dark:bg-black">
          <div className="mx-auto w-full max-w-3xl">
            <p className="text-sm text-foreground/70">
              Loading confirmation...
            </p>
          </div>
        </section>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
