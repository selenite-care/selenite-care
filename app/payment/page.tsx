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

function PaymentForm({
  service,
  surveyId,
  doctorId,
}: {
  service: Service;
  surveyId: string;
  doctorId: string;
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
        appointmentTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
      className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10"
    >
      <h2 className="text-lg font-semibold text-foreground">Payment Details</h2>
      <div className="mt-5 rounded-md border border-black/10 px-3 py-4 dark:border-white/10">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: "#171717",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "16px",
                "::placeholder": {
                  color: "#71717a",
                },
              },
            },
          }}
        />
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Processing..." : `Pay $${service.price.toFixed(2)}`}
      </button>
    </form>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const doctorId = searchParams.get("doctorId") ?? "";
  const surveyId = searchParams.get("surveyId") ?? "";
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

  return (
    <section className="flex flex-1 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Complete Payment
          </h1>
          <p className="mt-4 text-base leading-7 text-foreground/70">
            Review your selected service and enter your card details to
            continue.
          </p>
        </div>

        {isLoading ? (
          <p className="mt-10 text-sm text-foreground/70">Loading payment...</p>
        ) : null}

        {error ? <p className="mt-10 text-sm text-red-600">{error}</p> : null}

        {!isLoading && !error && !selectedService ? (
          <p className="mt-10 text-sm text-foreground/70">
            Please choose a service before continuing to payment.
          </p>
        ) : null}

        {!isLoading && selectedService ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_24rem]">
            <PaymentForm
              service={selectedService}
              surveyId={surveyId}
              doctorId={doctorId}
            />

            <aside className="h-fit rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
              <h2 className="text-lg font-semibold text-foreground">
                Order Summary
              </h2>
              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    {selectedService.name}
                  </p>
                  <p className="mt-1 text-foreground/70">
                    {selectedService.duration} minute consultation
                  </p>
                </div>
                <div className="border-t border-black/10 pt-4 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/70">Total</span>
                    <span className="font-semibold text-foreground">
                      ${selectedService.price.toFixed(2)}
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
      <section className="flex flex-1 bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Payment Unavailable
          </h1>
          <p className="mt-4 text-sm text-foreground/70">
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
          <section className="flex flex-1 bg-zinc-50 px-6 py-16 dark:bg-black">
            <div className="mx-auto w-full max-w-6xl">
              <p className="text-sm text-foreground/70">Loading payment...</p>
            </div>
          </section>
        }
      >
        <PaymentContent />
      </Suspense>
    </Elements>
  );
}
