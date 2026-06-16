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
      <section
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F8F5F0",
          minHeight: "100vh",
        }}
      >
        <p style={{ color: "#B8A89A", fontSize: "14px" }}>Redirecting...</p>
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
    <section style={{
      display: 'flex',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8F5F0',
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingTop: '0px',
      paddingBottom: '64px',
      minHeight: '100vh',
    }}>
      <div style={{
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '100%',
        maxWidth: '384px',
        boxSizing: 'border-box',
      }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            letterSpacing: '-0.015em',
            color: '#2B2B2B',
            fontFamily: '"Playfair Display", serif',
          }}>
            Selenite Care
          </h1>
          <p style={{
            marginTop: '12px',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#B8A89A',
          }}>
            Sign in to manage your appointments and care plan.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            borderRadius: '12px',
            border: '1px solid #D8C7B5',
            backgroundColor: '#FFFFFF',
            padding: '20px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#2B2B2B',
                marginBottom: '8px',
              }}
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
              style={{
                height: '44px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #D8C7B5',
                backgroundColor: '#FFFFFF',
                paddingLeft: '12px',
                paddingRight: '12px',
                fontSize: '14px',
                color: '#2B2B2B',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
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
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#2B2B2B',
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              style={{
                height: '44px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #D8C7B5',
                backgroundColor: '#FFFFFF',
                paddingLeft: '12px',
                paddingRight: '12px',
                fontSize: '14px',
                color: '#2B2B2B',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
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
                style={{
                  fontSize: '13px',
                  color: '#C6A56B',
                  textDecoration: 'underline',
                }}
              >
                Forgot password?
              </a>
            </div>
          </div>

          {error ? <p style={{
            fontSize: '14px',
            color: '#dc2626',
          }}>{error}</p> : null}

          {showResendVerification ? (
            <div style={{ marginTop: '-8px' }}>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending || resendCountdown > 0 || !email}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  color:
                    isResending || resendCountdown > 0 || !email
                      ? '#B8A89A'
                      : '#C6A56B',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  cursor:
                    isResending || resendCountdown > 0 || !email
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {isResending
                  ? 'Sending...'
                  : resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : 'Resend verification email'}
              </button>
              {resendMessage ? (
                <p
                  style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: resendMessage.includes('already verified')
                      ? '#8A6A2F'
                      : '#6E6257',
                  }}
                >
                  {resendMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              display: 'flex',
              height: '44px',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              backgroundColor: isSubmitting ? '#D8C7B5' : '#2B2B2B',
              paddingLeft: '16px',
              paddingRight: '16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#F8F5F0',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#B8A89A';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#2B2B2B';
              }
            }}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
          <p style={{
            marginTop: '12px',
            fontSize: '14px',
            lineHeight: '1.5',
            textAlign: 'center',
            color: '#B8A89A',
          }}>
            Not an User? 
            <a 
            href="/register"
            style={{
            marginTop: '12px',
            fontSize: '14px',
            lineHeight: '1.5',
            textAlign: 'center',
            color: '#2B2B2B',
            textDecoration: 'underline',
          }}> Register </a>here.
          </p>
        </form>
      </div>
    </section>
  );
}

function LoginLoadingFallback() {
  return (
    <section
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8F5F0",
        minHeight: "100vh",
      }}
    >
      <p style={{ color: "#B8A89A", fontSize: "14px" }}>Loading...</p>
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
