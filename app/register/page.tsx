"use client";

import "react-phone-number-input/style.css";

import { FormEvent, Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";

function RegisterPageContent() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState("");

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

    router.push("/login");
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
