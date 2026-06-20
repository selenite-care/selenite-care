"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn, useSession } from "next-auth/react";

type UserSession = {
  user?: {
    role?: string;
  };
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = searchParams.get("callbackUrl");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const role = session?.user?.role;

    if (role === "ADMIN") router.replace("/admin");
    else if (role === "DOCTOR") router.replace("/doctor");
    else if (role === "CRM") router.replace("/crm");
    else router.replace("/dashboard");
  }, [router, session?.user?.role, status]);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  if (status === "authenticated") {
    return (
      <section className="bg-page flex min-h-screen flex-1 items-center justify-center px-4">
        <p className="text-muted text-sm">Redirecting...</p>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResendMessage("");
    setShowResendVerification(false);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email: submittedEmail,
      password,
      redirect: false,
    });

    if (result?.error) {
      if (result.code === "email_not_verified") {
        setError("Please verify your email before logging in. Check your inbox.");
        setShowResendVerification(true);
      } else if (result.code === "account_inactive") {
        setError("This account has been deactivated. Please contact the admin.");
      } else {
        setError("Invalid email or password.");
      }
      setIsSubmitting(false);
      return;
    }

    const session = (await getSession()) as UserSession | null;
    const role = session?.user?.role;

    if (callbackUrl?.startsWith("/")) router.push(callbackUrl);
    else if (role === "ADMIN") router.push("/admin");
    else if (role === "DOCTOR") router.push("/doctor");
    else if (role === "CRM") router.push("/crm");
    else router.push("/dashboard");
  }

  async function handleResendVerification() {
    if (!email || resendCountdown > 0) {
      return;
    }

    setIsResending(true);
    setResendMessage("");

    try {
      const response = await fetch("/api/resend-verification", {
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
          data?.error ?? "Unable to resend verification email right now.",
        );
      }

      setResendMessage(
        data?.message ??
          "If an account with that email exists, a verification link has been sent.",
      );
      setResendCountdown(60);
    } catch (resendError) {
      setResendMessage(
        resendError instanceof Error
          ? resendError.message
          : "Unable to resend verification email right now.",
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <section className="bg-page flex min-h-screen flex-1 items-center justify-center px-4 pb-16 pt-0">
      <div className="mx-auto w-full max-w-sm box-border">
        <div className="mb-8 text-center">
          <h1
            className="text-page text-[28px] font-semibold tracking-[-0.015em]"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Selenite Care
          </h1>
          <p className="text-muted mt-3 text-sm leading-6">
            Sign in to manage your appointments and care plan.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-themed bg-card flex w-full flex-col gap-5 rounded-xl border p-5 shadow-[0_16px_34px_rgba(43,43,43,0.06)] dark:shadow-none"
        >
          <div>
            <label
              htmlFor="email"
              className="text-page mb-2 block text-sm font-medium"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-lg border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors dark:bg-[#1E1C1A] dark:border-[#3D3530] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C6A56B';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D8C7B5';
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-page mb-2 block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 w-full rounded-lg border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors dark:bg-[#1E1C1A] dark:border-[#3D3530] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C6A56B';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D8C7B5';
              }}
            />
            <div style={{ marginTop: '8px', textAlign: 'right' }}>
              <a
                href="/forgot-password"
                className="text-[13px] text-[#C6A56B] underline transition-opacity hover:opacity-80 dark:text-[#D4B47A]"
              >
                Forgot password?
              </a>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          {showResendVerification ? (
            <div className="-mt-2">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending || resendCountdown > 0 || !email}
                className={`bg-transparent p-0 text-sm underline transition-opacity ${
                  isResending || resendCountdown > 0 || !email
                    ? "cursor-not-allowed text-[#B8A89A] dark:text-[#8A7D75]"
                    : "cursor-pointer text-[#C6A56B] hover:opacity-80 dark:text-[#D4B47A]"
                }`}
              >
                {isResending
                  ? 'Sending...'
                  : resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : 'Resend verification email'}
              </button>
              {resendMessage ? (
                <p
                  className={`mt-2 text-[13px] leading-6 ${
                    resendMessage.includes('already verified')
                      ? "text-[#8A6A2F] dark:text-[#D4B47A]"
                      : "text-[#6E6257] dark:text-[#8A7D75]"
                  }`}
                >
                  {resendMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex h-11 w-full items-center justify-center rounded-lg border-0 px-4 text-sm font-medium text-[#F8F5F0] transition-colors ${
              isSubmitting
                ? "cursor-not-allowed bg-[#D8C7B5] opacity-70 dark:bg-[#3D3530] dark:text-[#8A7D75]"
                : "cursor-pointer bg-[#2B2B2B] hover:bg-[#B8A89A] dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
            }`}
            onMouseEnter={(e) => {
              void e;
            }}
            onMouseLeave={(e) => {
              void e;
            }}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
          <p className="text-muted mt-3 text-center text-sm leading-6">
            Not a User?{" "}
            <a 
            href="/register"
            className="text-page underline transition-opacity hover:opacity-80"
          > Register </a>here.
          </p>
        </form>
      </div>
    </section>
  );
}

function LoginLoadingFallback() {
  return (
    <section className="bg-page flex min-h-screen flex-1 items-center justify-center px-4">
      <p className="text-muted text-sm">Loading...</p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
