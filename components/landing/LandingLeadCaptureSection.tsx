"use client";

import { FormEvent, useState } from "react";

type LeadResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
};

export default function LandingLeadCaptureSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("Not Sure Yet");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError("Please provide both your name and phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/landing/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          interest: interest.trim() || undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | LeadResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to send your details right now.");
      }

      setIsSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send your details right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto mt-4 w-full max-w-6xl">
      <div className="rounded-[24px] bg-[#F8F5F0] px-5 py-12 dark:bg-[#141210] sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Interested? Let Us Call You
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6E6257] dark:text-[#8A7D75]">
            Leave your details and our team will reach out to answer your
            questions and help you choose the right membership.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-[#D8C7B5] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220] sm:p-8">
          {isSuccess ? (
            <div className="text-center">
              <p
                className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Thank you! Our team will contact you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="lead-name"
                  className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  Name
                </label>
                <input
                  id="lead-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="lead-phone"
                  className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  Phone Number
                </label>
                <input
                  id="lead-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
                  placeholder="Your phone number"
                  required
                />
                <p className="mt-2 text-xs leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
                  We will call/WhatsApp this number
                </p>
              </div>

              <div>
                <label
                  htmlFor="lead-email"
                  className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  Email
                </label>
                <input
                  id="lead-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
                  placeholder="Your email address (optional)"
                />
              </div>

              <div>
                <label
                  htmlFor="lead-interest"
                  className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  Which membership interests you?
                </label>
                <select
                  id="lead-interest"
                  value={interest}
                  onChange={(event) => setInterest(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                >
                  <option value="Signature">Signature</option>
                  <option value="Crystal">Crystal</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Not Sure Yet">Not Sure Yet</option>
                </select>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#3A3734] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
              >
                {isSubmitting ? "Sending..." : "Send My Details"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
