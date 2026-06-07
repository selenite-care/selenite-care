"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";

type UserSession = {
  user?: {
    role?: string;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
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

  return (
    <section style={{
      display: 'flex',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8F5F0',
      paddingLeft: '24px',
      paddingRight: '24px',
      paddingTop: '0px',
      paddingBottom: '64px',
      minHeight: '100vh',
    }}>
      <div style={{
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '100%',
        maxWidth: '384px',
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
            padding: '24px',
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
