"use client";

import "react-phone-number-input/style.css";

import { FormEvent, Suspense, useEffect, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";

function RegisterPageContent() {
  const [error, setError] = useState("");
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
    setError("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const dateOfBirth = String(formData.get("dateOfBirth") ?? "");

    if (!phone || !isValidPhoneNumber(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setIsSubmitting(true);

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

      setError(data?.error ?? "Registration failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setRegisteredEmail(email);
    setResendCountdown(60);
    setIsSubmitting(false);
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
    <section style={{
      display: 'flex',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8F5F0',
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingTop: '64px',
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
          {registeredEmail ? (
            <div
              style={{
                borderRadius: '12px',
                border: '1px solid #D8C7B5',
                backgroundColor: '#FFFFFF',
                padding: '28px 20px',
              }}
            >
              <div
                style={{
                  margin: '0 auto',
                  display: 'flex',
                  height: '64px',
                  width: '64px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(198, 165, 107, 0.12)',
                  color: '#C6A56B',
                }}
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

              <h1 style={{
                marginTop: '20px',
                fontSize: '30px',
                fontWeight: '600',
                letterSpacing: '-0.015em',
                color: '#2B2B2B',
                fontFamily: '"Playfair Display", serif',
              }}>
                Verify Your Email
              </h1>
              <p style={{
                marginTop: '14px',
                fontSize: '14px',
                lineHeight: '1.7',
                color: '#6E6257',
              }}>
                We've sent a verification link to{" "}
                <span style={{ color: '#2B2B2B', fontWeight: 600 }}>
                  {registeredEmail}
                </span>
                . Please check your inbox (and spam folder) and click the link
                to activate your account before logging in.
              </p>

              <div style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending || resendCountdown > 0}
                  style={{
                    display: 'flex',
                    height: '44px',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    backgroundColor:
                      isResending || resendCountdown > 0 ? '#D8C7B5' : '#2B2B2B',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#F8F5F0',
                    border: 'none',
                    cursor:
                      isResending || resendCountdown > 0
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: isResending || resendCountdown > 0 ? 0.8 : 1,
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {isResending
                    ? 'Sending...'
                    : resendCountdown > 0
                      ? `Resend in ${resendCountdown}s`
                      : 'Resend Verification Email'}
                </button>
              </div>

              {resendSuccess ? (
                <p style={{ marginTop: '14px', fontSize: '14px', color: '#8A6A2F' }}>
                  {resendSuccess}
                </p>
              ) : null}

              {resendError ? (
                <p style={{ marginTop: '14px', fontSize: '14px', color: '#dc2626' }}>
                  {resendError}
                </p>
              ) : null}
            </div>
          ) : (
            <>
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
                Join Selenite Care to book appointments and manage your care.
              </p>
            </>
          )}
        </div>

        {!registeredEmail ? (
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
                htmlFor="name"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2B2B2B',
                  marginBottom: '8px',
                }}
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
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
            </div>

            <div>
              <label
                htmlFor="phone"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2B2B2B',
                  marginBottom: '8px',
                }}
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
                htmlFor="dateOfBirth"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2B2B2B',
                  marginBottom: '8px',
                }}
              >
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
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
                autoComplete="new-password"
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
            </div>

            {error ? <p style={{
              fontSize: '14px',
              color: '#dc2626',
            }}>{error}</p> : null}

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
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
            <p style={{
              marginTop: '12px',
              fontSize: '14px',
              lineHeight: '1.5',
              textAlign: 'center',
              color: '#B8A89A',
            }}>
              Already an User? 
              <a 
              href="/login"
              style={{
              marginTop: '12px',
              fontSize: '14px',
              lineHeight: '1.5',
              textAlign: 'center',
              color: '#2B2B2B',
              textDecoration: 'underline',
            }}> Login </a>here.
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
      `}</style>
    </section>
  );
}

function RegisterLoadingFallback() {
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoadingFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
