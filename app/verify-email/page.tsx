"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type VerifyState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    let isMounted = true;

    async function verifyEmail() {
      if (!token) {
        if (!isMounted) return;
        setState("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const response = await fetch(
          `/api/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = (await response.json().catch(() => null)) as
          | { success?: boolean; message?: string; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(
            data?.error ?? "Unable to verify your email right now.",
          );
        }

        if (!isMounted) return;

        setState("success");
        setMessage(data?.message ?? "Email verified! You can now login.");
      } catch (error) {
        if (!isMounted) return;

        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify your email right now.",
        );
      }
    }

    void verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const isSuccess = state === "success";

  return (
    <section
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border px-6 py-10 text-center shadow-sm sm:px-10"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#D8C7B5" }}
      >
        <p
          className="text-sm font-semibold uppercase tracking-[0.22em]"
          style={{ color: "#C6A56B" }}
        >
          Selenite Care
        </p>

        <h1
          className="mt-4 text-3xl font-semibold sm:text-4xl"
          style={{ color: "#2B2B2B", fontFamily: "Playfair Display, serif" }}
        >
          {isSuccess ? "Email Verified" : state === "loading" ? "Please Wait" : "Verification Failed"}
        </h1>

        <p
          className="mt-4 text-sm leading-7 sm:text-base"
          style={{ color: "#6E6257" }}
        >
          {message}
        </p>

        <div className="mt-8">
          {state === "loading" ? (
            <div
              className="mx-auto h-11 w-40 animate-pulse rounded-md"
              style={{ backgroundColor: "#D8C7B5" }}
            />
          ) : isSuccess ? (
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
            >
              Go to Login
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-[#F8F5F0]"
              style={{ borderColor: "#C6A56B", color: "#2B2B2B" }}
            >
              Back to Register
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function VerifyEmailFallback() {
  return (
    <section
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <p style={{ color: "#B8A89A" }}>Loading...</p>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
