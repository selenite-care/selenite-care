"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function BookingThankYouPage() {
  const searchParams = useSearchParams();
  const bookingId =
    searchParams?.get("token") ??
    searchParams?.get("bookingId") ??
    searchParams?.get("codeId") ??
    "";

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-2xl text-center">
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Selenite Care
          </h1>
          <p className="mt-2 text-lg text-foreground/70">
            Thank you for completing the consultation survey.
          </p>
        </div>

        <div className="rounded-lg border border-black/10 bg-background p-8 text-left dark:border-white/10">
          <h2 className="text-2xl font-semibold text-foreground">Thank You!</h2>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Your survey has been submitted successfully. Our skin expert will be in
            touch with you soon.
          </p>

          <div className="mt-6">
            <p className="text-sm font-medium text-foreground/60">Booking Token</p>
            <p className="mt-1 font-mono text-xs text-foreground/80 break-all">{bookingId || "—"}</p>
          </div>

          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
