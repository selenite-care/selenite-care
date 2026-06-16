"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!token) {
      setError("Password reset token is missing.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.error ?? "Unable to reset your password right now.",
        );
      }

      setSuccessMessage(
        data?.message ??
          "Your password has been reset successfully. You can now log in.",
      );
      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to reset your password right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="flex min-h-screen items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-semibold"
            style={{
              color: "#2B2B2B",
              fontFamily: '"Playfair Display", serif',
            }}
          >
            Reset Password
          </h1>
          <p className="mt-3 text-sm leading-6" style={{ color: "#6E6257" }}>
            Create a new password for your Selenite Care account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white p-6"
          style={{ borderColor: "#D8C7B5" }}
        >
          <label
            htmlFor="password"
            className="block text-sm font-medium"
            style={{ color: "#2B2B2B" }}
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            style={{ borderColor: "#D8C7B5" }}
          />

          <label
            htmlFor="confirmPassword"
            className="mt-4 block text-sm font-medium"
            style={{ color: "#2B2B2B" }}
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
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
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>

          {successMessage ? (
            <div className="mt-5 text-center">
              <Link
                href="/login"
                className="text-sm underline"
                style={{ color: "#C6A56B" }}
              >
                Go to Login
              </Link>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}

function ResetPasswordFallback() {
  return (
    <section
      className="flex min-h-screen items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <p style={{ color: "#B8A89A" }}>Loading...</p>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
