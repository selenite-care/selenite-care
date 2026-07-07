"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn, useSession } from "next-auth/react";
import InAppBrowserWarning from "@/components/ui/InAppBrowserWarning";
import { isInAppBrowser } from "@/lib/detectBrowser";

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
  const authError = searchParams.get("error");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isUsingInAppBrowser, setIsUsingInAppBrowser] = useState(false);

  function handleGoogleLogin() {
    document.cookie =
      "selenite_google_oauth_intent=login; path=/; max-age=300; samesite=lax";
    void signIn("google", { callbackUrl: "/dashboard" });
  }

  useEffect(() => {
    setIsUsingInAppBrowser(isInAppBrowser());
  }, []);

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
    if (!authError) {
      return;
    }

    if (authError === "GoogleProfileNotFound") {
      setError(
        "No Selenite Care profile exists for this Google account. Please use the email registered with Selenite Care or create your account first.",
      );
    } else if (authError === "AccountInactive") {
      setError("This account has been deactivated. Please contact the admin.");
    } else if (authError === "OAuthAccountNotLinked") {
      setError(
        "This email is registered with another sign-in method. Please log in with your password first, then connect Google from your profile.",
      );
    } else if (authError === "AccessDenied") {
      setError("Google sign-in was not allowed for this account.");
    } else {
      setError("Unable to sign in with Google. Please try again or contact support.");
    }

    router.replace("/login", { scroll: false });
  }, [authError, router]);

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
      rememberMe: rememberMe ? "true" : "false",
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
      <InAppBrowserWarning />
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
          {isUsingInAppBrowser ? (
            <div className="rounded-lg border border-[#B87B68] bg-[#F8F5F0] px-4 py-3 text-sm leading-6 text-[#2B2B2B] dark:bg-[#242220] dark:text-[#F0EDE8]">
              Google Sign-In is not available in this browser. Please open in
              Chrome or Safari, or use email registration below.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#2B2B2B] bg-white px-4 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#F8F5F0] dark:border-[#EADDCD] dark:bg-[#F0EDE8] dark:text-[#141210] dark:hover:bg-[#EADDCD]"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#EADDCD] dark:bg-[#3D3530]" />
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#884F38] dark:text-[#8A7D75]">
              or
            </span>
            <div className="h-px flex-1 bg-[#EADDCD] dark:bg-[#3D3530]" />
          </div>

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
              className="h-11 w-full rounded-lg border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors dark:bg-[#1E1C1A] dark:border-[#3D3530] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#B87B68';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EADDCD';
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
              className="h-11 w-full rounded-lg border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors dark:bg-[#1E1C1A] dark:border-[#3D3530] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#B87B68';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EADDCD';
              }}
            />
            <div style={{ marginTop: '8px', textAlign: 'right' }}>
              <a
                href="/forgot-password"
                className="text-[13px] text-[#B87B68] underline transition-opacity hover:opacity-80 dark:text-[#D4B47A]"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <label className="text-page flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border border-[#EADDCD] accent-[#B87B68] dark:border-[#3D3530]"
            />
            <span className="text-muted">Remember me</span>
          </label>

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
                    ? "cursor-not-allowed text-[#884F38] dark:text-[#8A7D75]"
                    : "cursor-pointer text-[#B87B68] hover:opacity-80 dark:text-[#D4B47A]"
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
                ? "cursor-not-allowed bg-[#EADDCD] opacity-70 dark:bg-[#3D3530] dark:text-[#8A7D75]"
                : "cursor-pointer bg-[#2B2B2B] hover:bg-[#884F38] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
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
