"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OrdersConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? searchParams.get("id") ?? "";

  return (
    <main className="flex min-h-screen items-center bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-3xl">
        <section className="rounded-[28px] border border-[#EADDCD] bg-white px-6 py-12 text-center shadow-sm dark:border-[#3D3530] dark:bg-[#242220] sm:px-10">
          <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-[#B87B68] to-transparent" />

          <h1
            className="text-4xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Order Placed Successfully!
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#6E6257] dark:text-[#8A7D75] sm:text-lg">
            Our team will verify your payment and process your order. You will
            receive an update via email.
          </p>

          {orderId ? (
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-[#B87B68] bg-[rgba(198,165,107,0.08)] px-5 py-4 dark:bg-[rgba(198,165,107,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7967] dark:text-[#8A7D75]">
                Order ID
              </p>
              <p
                className="mt-2 text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-2xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {orderId}
              </p>
            </div>
          ) : null}

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard/orders"
              className="inline-flex h-12 items-center justify-center rounded-md border border-[#EADDCD] bg-[#2B2B2B] px-6 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] dark:border-[#3D3530] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
            >
              View My Orders
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function OrdersConfirmationFallback() {
  return (
    <main className="flex min-h-screen items-center bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm text-[#884F38] dark:text-[#8A7D75]">Loading...</p>
      </div>
    </main>
  );
}

export default function OrdersConfirmationPage() {
  return (
    <Suspense fallback={<OrdersConfirmationFallback />}>
      <OrdersConfirmationContent />
    </Suspense>
  );
}
