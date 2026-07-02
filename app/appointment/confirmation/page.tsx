"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AppointmentConfirmationPageContent() {
  const searchParams = useSearchParams();
  const bookingToken = searchParams.get("bookingToken") ?? "";

  return (
    <main className="flex min-h-screen items-center bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-3xl">
        <section
          className="rounded-[28px] border bg-white px-6 py-12 text-center shadow-sm dark:bg-[#242220] dark:border-[#3D3530] sm:px-10"
          style={{
            boxShadow: "0 24px 60px rgba(43, 43, 43, 0.08)",
          }}
        >
          <div
            className="mx-auto mb-6 h-1 w-24 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #B87B68 50%, transparent 100%)",
            }}
          />

          <h1
            className="text-4xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Appointment Request Submitted!
          </h1>

          <div
            className="mx-auto mt-8 max-w-md rounded-2xl border px-5 py-4 dark:border-[#3D3530]"
            style={{
              borderColor: "#B87B68",
              backgroundColor: "rgba(198, 165, 107, 0.08)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: "#8C7967" }}
            >
              Booking Token
            </p>
            <p
              className="mt-2 text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-2xl"
              style={{
                fontFamily: "Playfair Display, serif",
              }}
            >
              {bookingToken || "Pending Assignment"}
            </p>
          </div>

          <p
            className="mx-auto mt-8 max-w-2xl text-base leading-8 text-[#6E6257] dark:text-[#8A7D75] sm:text-lg"
          >
            Our team will contact you shortly to confirm your appointment time.
            Please keep your phone available.
          </p>

          <Link
            href="/dashboard"
            className="mt-10 inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors hover:bg-[#884F38]"
            style={{
              backgroundColor: "#2B2B2B",
              color: "#F8F5F0",
              border: "1px solid #EADDCD",
            }}
          >
            Go to Dashboard
          </Link>
        </section>
      </div>
    </main>
  );
}

function AppointmentConfirmationLoadingFallback() {
  return (
    <main className="flex min-h-screen items-center bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm text-[#884F38] dark:text-[#8A7D75]">
          Loading...
        </p>
      </div>
    </main>
  );
}

export default function AppointmentConfirmationPage() {
  return (
    <Suspense fallback={<AppointmentConfirmationLoadingFallback />}>
      <AppointmentConfirmationPageContent />
    </Suspense>
  );
}
