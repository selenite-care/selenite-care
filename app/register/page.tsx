"use client";

import "react-phone-number-input/style.css";

import { FormEvent, Suspense, useEffect, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";

function RegisterPageContent() {
  const [error, setError] = useState("");
  const [showExistingAccountNotice, setShowExistingAccountNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setShowExistingAccountNotice(false);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const dateOfBirth = String(formData.get("dateOfBirth") ?? "");

    if (!phone || !isValidPhoneNumber(phone)) {
      setError("Please enter a valid phone number.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone, email, password, dateOfBirth }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        if (response.status === 409) {
          setShowExistingAccountNotice(true);
          return;
        }

        setError(data?.error ?? "Registration failed. Please try again.");
        return;
      }

      setRegisteredEmail(email);
      setResendCountdown(60);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    if (!registeredEmail || resendCountdown > 0) {
      return;
    }

    setResendError("");
    setResendSuccess("");
    setIsResending(true);

    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: registeredEmail }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.error ?? "Unable to resend verification email right now.",
        );
      }

      setResendSuccess("Verification email sent again. Please check your inbox.");
      setResendCountdown(60);
    } catch (resendActionError) {
      setResendError(
        resendActionError instanceof Error
          ? resendActionError.message
          : "Unable to resend verification email right now.",
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <section className="bg-page flex min-h-screen flex-1 items-center justify-center px-4 py-16">
      <div className="mx-auto w-full max-w-sm box-border">
        <div className="mb-8 text-center">
          {registeredEmail ? (
            <div
              className="border-themed bg-card rounded-xl border px-5 py-7 shadow-[0_16px_34px_rgba(43,43,43,0.06)] dark:shadow-none"
            >
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(198,165,107,0.12)] text-[#C6A56B] dark:bg-[rgba(212,180,122,0.16)] dark:text-[#D4B47A]"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12.5L9.5 17L19 7.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1
                className="text-page mt-5 text-[30px] font-semibold tracking-[-0.015em]"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Verify Your Email
              </h1>
              <p className="mt-[14px] text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                We've sent a verification link to{" "}
                <span className="text-page font-semibold">
                  {registeredEmail}
                </span>
                . Please check your inbox (and spam folder) and click the link
                to activate your account before logging in.
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending || resendCountdown > 0}
                  className={`flex h-11 w-full items-center justify-center rounded-lg border-0 px-4 text-sm font-medium text-[#F8F5F0] transition-colors ${
                    isResending || resendCountdown > 0
                      ? "cursor-not-allowed bg-[#D8C7B5] opacity-80 dark:bg-[#3D3530] dark:text-[#8A7D75]"
                      : "cursor-pointer bg-[#2B2B2B] hover:bg-[#B8A89A] dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
                  }`}
                >
                  {isResending
                    ? 'Sending...'
                    : resendCountdown > 0
                      ? `Resend in ${resendCountdown}s`
                      : 'Resend Verification Email'}
                </button>
              </div>

              {resendSuccess ? (
                <p className="mt-[14px] text-sm text-[#8A6A2F] dark:text-[#D4B47A]">
                  {resendSuccess}
                </p>
              ) : null}

              {resendError ? (
                <p className="mt-[14px] text-sm text-red-600 dark:text-red-400">
                  {resendError}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <h1
                className="text-page text-[28px] font-semibold tracking-[-0.015em]"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Selenite Care
              </h1>
              <p className="text-muted mt-3 text-sm leading-6">
                Join Selenite Care to book appointments and manage your care.
              </p>
            </>
          )}
        </div>

        {!registeredEmail ? (
          <form
            onSubmit={handleSubmit}
            className="border-themed bg-card flex w-full flex-col gap-5 rounded-xl border p-5 shadow-[0_16px_34px_rgba(43,43,43,0.06)] dark:shadow-none"
          >
            <div>
              <label
                htmlFor="name"
                className="text-page mb-2 block text-sm font-medium"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
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
                htmlFor="phone"
                className="text-page mb-2 block text-sm font-medium"
              >
                Phone
              </label>
              <div className="brand-phone-input-wrapper">
                <PhoneInput
                  id="phone"
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="BD"
                  value={phone}
                  onChange={(value) => setPhone(value ?? "")}
                  className="brand-phone-input"
                  numberInputProps={{
                    autoComplete: "tel",
                    required: true,
                  }}
                />
              </div>
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
                htmlFor="dateOfBirth"
                className="text-page mb-2 block text-sm font-medium"
              >
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className="h-11 w-full rounded-lg border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors dark:bg-[#1E1C1A] dark:border-[#3D3530] dark:text-[#F0EDE8]"
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
                autoComplete="new-password"
                required
                className="h-11 w-full rounded-lg border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors dark:bg-[#1E1C1A] dark:border-[#3D3530] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#C6A56B';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#D8C7B5';
                }}
              />
            </div>

            {showExistingAccountNotice ? (
              <div
                className="rounded-[10px] border border-[#C6A56B] bg-[#F8F5F0] px-4 py-[14px] dark:bg-[#242220]"
              >
                <p
                  className="m-0 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]"
                >
                  An account with this email already exists. If you registered
                  recently but haven&apos;t verified your email yet, please check
                  your inbox for the verification link. You can also request a
                  new verification email from the login page.
                </p>
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

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
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
            <p className="text-muted mt-3 text-center text-sm leading-6">
              Already a User?{" "}
              <a 
              href="/login"
              className="text-page underline transition-opacity hover:opacity-80"
            > Login </a>here.
            </p>
          </form>
        ) : null}
      </div>

      <style jsx global>{`
        .brand-phone-input-wrapper .PhoneInput {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 44px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid #d8c7b5;
          background-color: #ffffff;
          padding: 0 12px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .brand-phone-input-wrapper .PhoneInput:focus-within {
          border-color: #c6a56b;
          box-shadow: 0 0 0 1px #c6a56b;
        }

        .brand-phone-input-wrapper .PhoneInputCountry {
          margin-right: 0;
        }

        .brand-phone-input-wrapper .PhoneInputCountrySelect {
          cursor: pointer;
        }

        .brand-phone-input-wrapper .PhoneInputCountryIcon {
          box-shadow: none;
        }

        .brand-phone-input-wrapper .PhoneInputCountrySelectArrow {
          color: #b8a89a;
          opacity: 1;
        }

        .brand-phone-input-wrapper .PhoneInputInput {
          height: 100%;
          width: 100%;
          border: 0;
          background: transparent;
          color: #2b2b2b;
          font-size: 14px;
          outline: none;
          box-shadow: none;
        }

        .brand-phone-input-wrapper .PhoneInputInput::placeholder {
          color: #b8a89a;
        }

        .dark .brand-phone-input-wrapper .PhoneInput {
          border-color: #3d3530;
          background-color: #1e1c1a;
        }

        .dark .brand-phone-input-wrapper .PhoneInputCountrySelectArrow {
          color: #8a7d75;
        }

        .dark .brand-phone-input-wrapper .PhoneInputInput {
          color: #f0ede8;
        }

        .dark .brand-phone-input-wrapper .PhoneInputInput::placeholder {
          color: #8a7d75;
        }
      `}</style>
    </section>
  );
}

function RegisterLoadingFallback() {
  return (
    <section className="bg-page flex min-h-screen flex-1 items-center justify-center px-4">
      <p className="text-muted text-sm">Loading...</p>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoadingFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
