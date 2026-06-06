"use client";

import { useSession } from "next-auth/react"
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { Service } from "@/types";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

type CreateIntentResponse = {
  clientSecret?: string;
  error?: string;
};

type CreateBookingResponse = {
  bookingId?: string;
  token?: string;
  error?: string;
};

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

function PaymentForm({
  service,
  surveyId,
  doctorId,
  appointmentDate,
  appointmentSlot,
}: {
  service: Service;
  surveyId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentSlot: string;
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession()
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!stripe || !elements) {
      setError("Payment form is still loading.");
      setIsSubmitting(false);
      return;
    }

    if (!appointmentDate || !appointmentSlot) {
      setError("Please select a date and slot before submitting payment.");
      setIsSubmitting(false);
      return;
    }

    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentSlot}:00`);

    if (Number.isNaN(appointmentDateTime.getTime())) {
      setError("Selected appointment date or slot is invalid.");
      setIsSubmitting(false);
      return;
    }

    const card = elements.getElement(CardElement);

    if (!card) {
      setError("Card details are required.");
      setIsSubmitting(false);
      return;
    }

    const intentResponse = await fetch("/api/payment/create-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ serviceId: service.id }),
    });
    const intentData = (await intentResponse.json()) as CreateIntentResponse;

    if (!intentResponse.ok || !intentData.clientSecret) {
      setError(intentData.error ?? "Unable to start payment.");
      setIsSubmitting(false);
      return;
    }

    const { error: paymentError, paymentIntent } =
      await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card,
        },
      });

    if (paymentError || paymentIntent?.status !== "succeeded") {
      setError(paymentError?.message ?? "Payment was not completed.");
      setIsSubmitting(false);
      return;
    }

    const bookingResponse = await fetch("/api/booking/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: session?.user?.id,
        serviceId: service.id,
        doctorId,
        stripePaymentId: paymentIntent.id,
        appointmentTime: appointmentDateTime.toISOString(),
        surveyId,
      }),
    });

    if (!bookingResponse.ok) {
      const bookingData = (await bookingResponse.json().catch(() => null)) as
        | CreateBookingResponse
        | null;

      setError(bookingData?.error ?? "Payment succeeded, but booking failed.");
      setIsSubmitting(false);
      return;
    }

    const bookingData = (await bookingResponse.json()) as CreateBookingResponse;
    const token = bookingData.token ?? "";
    router.push(
      token
        ? `/booking/thank-you?token=${encodeURIComponent(token)}`
        : "/booking/thank-you",
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        borderRadius: '12px',
        border: '1px solid #D8C7B5',
        backgroundColor: '#FFFFFF',
        padding: '24px',
      }}
    >
      <h2 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#2B2B2B',
        fontFamily: '"Playfair Display", serif',
      }}>Payment Details</h2>
      <div style={{
        marginTop: '20px',
        borderRadius: '8px',
        border: '2px solid #D8C7B5',
        padding: '12px',
        transition: 'border-color 0.2s ease',
      }}
      onFocus={(e) => {
        if (e.currentTarget === e.currentTarget.parentElement) {
          e.currentTarget.style.borderColor = '#C6A56B';
        }
      }}
      onBlur={(e) => {
        if (e.currentTarget === e.currentTarget.parentElement) {
          e.currentTarget.style.borderColor = '#D8C7B5';
        }
      }}
      >
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: "#2B2B2B",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "16px",
                "::placeholder": {
                  color: "#B8A89A",
                },
              },
            },
          }}
        />
      </div>

      {error ? <p style={{
        marginTop: '16px',
        fontSize: '14px',
        color: '#dc2626',
      }}>{error}</p> : null}

      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        style={{
          marginTop: '24px',
          display: 'flex',
          height: '44px',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          backgroundColor: !stripe || isSubmitting ? '#D8C7B5' : '#2B2B2B',
          paddingLeft: '20px',
          paddingRight: '20px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#F8F5F0',
          border: 'none',
          cursor: !stripe || isSubmitting ? 'not-allowed' : 'pointer',
          opacity: !stripe || isSubmitting ? 0.7 : 1,
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!(!stripe || isSubmitting)) {
            e.currentTarget.style.backgroundColor = '#B8A89A';
          }
        }}
        onMouseLeave={(e) => {
          if (!(!stripe || isSubmitting)) {
            e.currentTarget.style.backgroundColor = '#2B2B2B';
          }
        }}
      >
        {isSubmitting ? "Processing..." : `Pay ${formatBdt(service.price)}`}
      </button>
    </form>
  );
}

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const doctorId = searchParams.get("doctorId") ?? "";
  const surveyId = searchParams.get("surveyId") ?? "";
  const selectedSlot = searchParams.get("slot") ?? "";
  const selectedDate = searchParams.get("date") ?? "";
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch("/api/services");

        if (!response.ok) {
          throw new Error("Unable to load services.");
        }

        const data = (await response.json()) as { services?: Service[] };
        setServices(data.services ?? []);
      } catch {
        setError("Unable to load your selected service.");
      } finally {
        setIsLoading(false);
      }
    }

    loadServices();
  }, []);

  const selectedService =
    services.find((service) => service.id === serviceId) ?? null;
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bkash">("card");

  return (
    <section style={{
      display: 'flex',
      flex: 1,
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
        maxWidth: '1280px',
      }}>
        <div style={{ maxWidth: '512px' }}>
          <h1 style={{
            fontSize: '30px',
            fontWeight: '600',
            letterSpacing: '-0.015em',
            color: '#2B2B2B',
            fontFamily: '"Playfair Display", serif',
          }}>
            Complete Payment
          </h1>
          <p style={{
            marginTop: '16px',
            fontSize: '16px',
            lineHeight: '1.75',
            color: '#B8A89A',
          }}>
            Review your selected service and choose your payment method.
          </p>
        </div>

        {isLoading ? (
          <p style={{
            marginTop: '40px',
            fontSize: '14px',
            color: '#B8A89A',
          }}>Loading payment...</p>
        ) : null}

        {error ? <p style={{
          marginTop: '40px',
          fontSize: '14px',
          color: '#dc2626',
        }}>{error}</p> : null}

        {!isLoading && !error && !selectedService ? (
          <p style={{
            marginTop: '40px',
            fontSize: '14px',
            color: '#B8A89A',
          }}>
            Please choose a service before continuing to payment.
          </p>
        ) : null}

        {!isLoading && selectedService ? (
          <div style={{
            marginTop: '40px',
            display: 'grid',
            gridTemplateColumns: '1fr 384px',
            gap: '32px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                borderRadius: '12px',
                border: '1px solid #D8C7B5',
                backgroundColor: '#FFFFFF',
                padding: '4px',
              }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  style={{
                    borderRadius: '8px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: paymentMethod === "card" ? '#2B2B2B' : 'transparent',
                    color: paymentMethod === "card" ? '#F8F5F0' : '#B8A89A',
                  }}
                  onMouseEnter={(e) => {
                    if (paymentMethod !== "card") {
                      e.currentTarget.style.color = '#2B2B2B';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (paymentMethod !== "card") {
                      e.currentTarget.style.color = '#B8A89A';
                    }
                  }}
                >
                  Pay with Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bkash")}
                  style={{
                    borderRadius: '8px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: paymentMethod === "bkash" ? '#2B2B2B' : 'transparent',
                    color: paymentMethod === "bkash" ? '#F8F5F0' : '#B8A89A',
                  }}
                  onMouseEnter={(e) => {
                    if (paymentMethod !== "bkash") {
                      e.currentTarget.style.color = '#2B2B2B';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (paymentMethod !== "bkash") {
                      e.currentTarget.style.color = '#B8A89A';
                    }
                  }}
                >
                  Pay with bKash
                </button>
              </div>

              {paymentMethod === "card" ? (
                !selectedSlot || !selectedDate ? (
                  <div style={{
                    borderRadius: '8px',
                    border: '1px solid #FFD700',
                    backgroundColor: '#FFFBEA',
                    padding: '24px',
                    fontSize: '14px',
                    color: '#8B6914',
                  }}>
                    Selected appointment date and slot are missing. Please choose a slot before proceeding to payment.
                  </div>
                ) : (
                  <PaymentForm
                    service={selectedService}
                    surveyId={surveyId}
                    doctorId={doctorId}
                    appointmentDate={selectedDate}
                    appointmentSlot={selectedSlot}
                  />
                )
              ) : (
                <section style={{
                  borderRadius: '8px',
                  border: '1px solid #D8C7B5',
                  backgroundColor: '#FFFFFF',
                  padding: '24px',
                }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#2B2B2B',
                    fontFamily: '"Playfair Display", serif',
                  }}>
                    bKash Payment
                  </h2>
                  <p style={{
                    marginTop: '16px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: '#B8A89A',
                  }}>
                    bKash payment coming soon. Please use card payment for now.
                  </p>
                </section>
              )}
            </div>

            <aside style={{
              height: 'fit-content',
              borderRadius: '8px',
              border: '1px solid #D8C7B5',
              backgroundColor: '#FFFFFF',
              padding: '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#2B2B2B',
                fontFamily: '"Playfair Display", serif',
              }}>
                Order Summary
              </h2>
              <div style={{
                marginTop: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                fontSize: '14px',
              }}>
                <div>
                  <p style={{
                    fontWeight: '500',
                    color: '#2B2B2B',
                  }}>
                    {selectedService.name}
                  </p>
                </div>
                {selectedDate && selectedSlot ? (
                  <div style={{
                    borderRadius: '8px',
                    border: '1px solid #D8C7B5',
                    backgroundColor: '#F8F5F0',
                    padding: '16px',
                    fontSize: '14px',
                    color: '#2B2B2B',
                  }}>
                    <p style={{
                      fontWeight: '500',
                      color: '#2B2B2B',
                    }}>Appointment</p>
                    <p style={{
                      marginTop: '8px',
                      color: '#B8A89A',
                    }}>
                      {selectedDate} at {selectedSlot}
                    </p>
                  </div>
                ) : null}
                <div style={{
                  borderTop: '1px solid #D8C7B5',
                  paddingTop: '16px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ color: '#B8A89A' }}>Total</span>
                    <span style={{
                      fontWeight: '600',
                      color: '#2B2B2B',
                    }}>
                      {formatBdt(selectedService.price)}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function PaymentPage() {
  if (!stripePublishableKey || !stripePromise) {
    return (
      <section style={{
        display: 'flex',
        flex: 1,
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
          maxWidth: '1280px',
        }}>
          <h1 style={{
            fontSize: '30px',
            fontWeight: '600',
            letterSpacing: '-0.015em',
            color: '#2B2B2B',
            fontFamily: '"Playfair Display", serif',
          }}>
            Payment Unavailable
          </h1>
          <p style={{
            marginTop: '16px',
            fontSize: '14px',
            color: '#B8A89A',
          }}>
            Stripe publishable key is not configured.
          </p>
        </div>
      </section>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <Suspense
        fallback={
          <section style={{
            display: 'flex',
            flex: 1,
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
              maxWidth: '1280px',
            }}>
              <p style={{
                fontSize: '14px',
                color: '#B8A89A',
              }}>Loading...</p>
            </div>
          </section>
        }
      >
        <PaymentPageContent />
      </Suspense>
    </Elements>
  );
}
