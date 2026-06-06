"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BookingThankYouPageContent() {
  const searchParams = useSearchParams();
  const bookingId =
    searchParams?.get("token") ??
    searchParams?.get("bookingId") ??
    searchParams?.get("codeId") ??
    "";

  return (
    <section style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8F5F0',
      paddingLeft: '24px',
      paddingRight: '24px',
      paddingTop: '64px',
      paddingBottom: '64px',
    }}>
      <div style={{
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '100%',
        maxWidth: '512px',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '32px' }}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            style={{
              margin: '0 auto 24px',
              color: '#C6A56B',
            }}
          >
            <circle cx="40" cy="40" r="40" fill="currentColor" opacity="0.1" />
            <path
              d="M32 40L36 44L48 32"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#2B2B2B',
            fontFamily: '"Playfair Display", serif',
          }}>
            Thank You!
          </h1>
          <p style={{
            marginTop: '12px',
            fontSize: '16px',
            color: '#B8A89A',
            lineHeight: '1.6',
          }}>
            Your survey has been submitted successfully. Our skin expert will be in
            touch with you soon.
          </p>
        </div>

        <div style={{
          borderRadius: '12px',
          border: '2px solid #C6A56B',
          backgroundColor: '#FFFFFF',
          padding: '32px',
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#F8F5F0',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#B8A89A',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>Booking Token</p>
            <p style={{
              marginTop: '12px',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#2B2B2B',
              wordBreak: 'break-all',
              fontWeight: '500',
            }}>{bookingId || "—"}</p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                height: '44px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: '#2B2B2B',
                paddingLeft: '20px',
                paddingRight: '20px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#F8F5F0',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#B8A89A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2B2B2B';
              }}
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingThankYouLoadingFallback() {
  return (
    <section style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#F8F5F0',
      paddingLeft: '24px',
      paddingRight: '24px',
      paddingTop: '64px',
      paddingBottom: '64px',
    }}>
      <div style={{
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '100%',
        maxWidth: '512px',
      }}>
        <p style={{
          fontSize: '14px',
          color: '#B8A89A',
        }}>Loading...</p>
      </div>
    </section>
  );
}

export default function BookingThankYouPage() {
  return (
    <Suspense fallback={<BookingThankYouLoadingFallback />}>
      <BookingThankYouPageContent />
    </Suspense>
  );
}
