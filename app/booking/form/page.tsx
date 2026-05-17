"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

type SubmitFormResponse = {
  error?: string;
};

function ConsultationForm() {
  const searchParams = useSearchParams();
  const initialBookingId = searchParams.get("bookingId") ?? "";
  const [bookingId, setBookingId] = useState(initialBookingId);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      bookingId,
      skinType: String(formData.get("skinType") ?? ""),
      mainSkinConcerns: String(formData.get("mainSkinConcerns") ?? ""),
      currentSkincareRoutine: String(
        formData.get("currentSkincareRoutine") ?? "",
      ),
      allergies: String(formData.get("allergies") ?? ""),
      additionalNotes: String(formData.get("additionalNotes") ?? ""),
    };

    const response = await fetch("/api/booking/submit-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | SubmitFormResponse
        | null;

      setError(data?.error ?? "Unable to submit consultation form.");
      setIsSubmitting(false);
      return;
    }

    setStatus("Your consultation form has been submitted.");
    setIsSubmitting(false);
  }

  return (
    <section className="flex flex-1 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Consultation Form
          </h1>
          <p className="mt-4 text-base leading-7 text-foreground/70">
            Share a few details so your consultant can prepare for your
            appointment.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10"
        >
          <div>
            <label
              htmlFor="bookingId"
              className="block text-sm font-medium text-foreground"
            >
              Booking ID
            </label>
            <input
              id="bookingId"
              name="bookingId"
              type="text"
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
              required
              className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
            />
          </div>

          <div>
            <label
              htmlFor="skinType"
              className="block text-sm font-medium text-foreground"
            >
              Skin Type
            </label>
            <input
              id="skinType"
              name="skinType"
              type="text"
              required
              className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
            />
          </div>

          <div>
            <label
              htmlFor="mainSkinConcerns"
              className="block text-sm font-medium text-foreground"
            >
              Main Skin Concerns
            </label>
            <textarea
              id="mainSkinConcerns"
              name="mainSkinConcerns"
              rows={4}
              required
              className="mt-2 w-full resize-none rounded-md border border-black/10 bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
            />
          </div>

          <div>
            <label
              htmlFor="currentSkincareRoutine"
              className="block text-sm font-medium text-foreground"
            >
              Current Skincare Routine
            </label>
            <textarea
              id="currentSkincareRoutine"
              name="currentSkincareRoutine"
              rows={4}
              required
              className="mt-2 w-full resize-none rounded-md border border-black/10 bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
            />
          </div>

          <div>
            <label
              htmlFor="allergies"
              className="block text-sm font-medium text-foreground"
            >
              Allergies
            </label>
            <textarea
              id="allergies"
              name="allergies"
              rows={3}
              className="mt-2 w-full resize-none rounded-md border border-black/10 bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
            />
          </div>

          <div>
            <label
              htmlFor="additionalNotes"
              className="block text-sm font-medium text-foreground"
            >
              Additional Notes
            </label>
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              rows={4}
              className="mt-2 w-full resize-none rounded-md border border-black/10 bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {status ? <p className="text-sm text-foreground/70">{status}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Submit Form"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function BookingFormPage() {
  return (
    <Suspense
      fallback={
        <section className="flex flex-1 bg-zinc-50 px-6 py-16 dark:bg-black">
          <div className="mx-auto w-full max-w-3xl">
            <p className="text-sm text-foreground/70">Loading form...</p>
          </div>
        </section>
      }
    >
      <ConsultationForm />
    </Suspense>
  );
}
