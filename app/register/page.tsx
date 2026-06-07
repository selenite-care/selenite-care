"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter } from "next/navigation";

function RegisterPageContent() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, phone, email, password }),
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
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
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
        </form>
      </div>
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
