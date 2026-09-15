"use client";

import { useEffect, useState } from "react";

export default function ReferralRedirectClient({
  code,
  influencerFirstName,
}: {
  code: string;
  influencerFirstName: string;
}) {
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function rememberReferral() {
      try {
        const response = await fetch("/api/referral/remember", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });
        const data = (await response.json().catch(() => null)) as
          | { redirectUrl?: string; error?: string }
          | null;

        if (!response.ok || !data?.redirectUrl) {
          throw new Error(data?.error ?? "Unable to apply referral code.");
        }

        window.location.replace(data.redirectUrl);
      } catch {
        if (isMounted) {
          setError("Unable to apply referral code. Redirecting...");
          window.setTimeout(() => {
            window.location.replace("/landing");
          }, 1200);
        }
      }
    }

    void rememberReferral();

    return () => {
      isMounted = false;
    };
  }, [code]);

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="max-w-xl rounded-2xl border border-[#EADDCD] bg-white p-8 text-center shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#B87B68]">
          Referral Applied
        </p>
        <h1
          className="mt-4 text-3xl font-bold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          {influencerFirstName} invited you!
        </h1>
        <p className="mt-4 text-base leading-7 text-[#6E6257] dark:text-[#8A7D75]">
          {"\u2728"} {influencerFirstName} invited you! Use code{" "}
          <span className="font-mono font-semibold text-[#D4B47A]">{code}</span>{" "}
          at checkout for 10% off your membership.
        </p>
        <p className="mt-5 text-sm text-[#884F38] dark:text-[#8A7D75]">
          {error || "Taking you to Selenite Care..."}
        </p>
      </div>
    </section>
  );
}
