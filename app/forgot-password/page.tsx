"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.error ?? "Unable to process your request right now.",
        );
      }

      setSuccessMessage(
        data?.message ??
          "If an account with that email exists, a password reset link has been sent.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to process your request right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]" style={{ fontFamily: '"Playfair Display", serif' }}>
            Forgot Password
          </h1>
          <p className="mt-3 text-sm leading-6" style={{ color: "#6E6257" }}>
            Enter your email and we will send you a reset link.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#D8C7B5] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]"
        >
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            style={{ borderColor: "#D8C7B5" }}
          />

          {error ? (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          ) : null}
          {successMessage ? (
            <p className="mt-4 text-sm leading-6" style={{ color: "#6E6257" }}>
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="text-sm underline text-[#C6A56B]"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
