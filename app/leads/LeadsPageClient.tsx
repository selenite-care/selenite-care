"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Sparkles,
  Stethoscope,
} from "lucide-react";

type LeadResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
};

const interestOptions = [
  "Membership packages",
  "Skin consultation",
  "Skincare procedures",
  "Product recommendations",
  "Not sure yet",
] as const;

const featureCards = [
  {
    icon: Stethoscope,
    title: "Expert Consultation",
    text: "Understand your skin with guidance from certified specialists.",
  },
  {
    icon: Sparkles,
    title: "Personalized Plans",
    text: "Get routine and care suggestions tailored to your skin goals.",
  },
  {
    icon: Package,
    title: "Product Guidance",
    text: "Learn which products fit your skin before spending blindly.",
  },
] as const;

export default function LeadsPageClient({ embedded = false }: { embedded?: boolean }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<(typeof interestOptions)[number]>(
    "Membership packages",
  );
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedPhone && !trimmedEmail) {
      setError("Please provide either your phone number or email address.");
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
          name: name.trim() || undefined,
          phone: trimmedPhone || undefined,
          email: trimmedEmail || undefined,
          interest: note.trim() ? `${interest} - ${note.trim()}` : interest,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | LeadResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to submit your details right now.");
      }

      setIsSuccess(true);
      setName("");
      setPhone("");
      setEmail("");
      setInterest("Membership packages");
      setNote("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your details right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const rootClassName = embedded
    ? "bg-page text-page"
    : "min-h-screen bg-[#F8F5F0] text-[#2B2B2B] dark:bg-[#1A1814] dark:text-[#F0EDE8]";
  const sectionClassName = embedded
    ? "relative overflow-hidden border-t border-themed bg-page px-6 py-14 sm:py-16"
    : "relative overflow-hidden px-6 py-14 sm:py-20";
  const contentShellClassName = embedded
    ? "relative mx-auto grid w-full max-w-6xl gap-8 rounded-[32px] border border-themed bg-card p-6 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-center sm:p-8"
    : "relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-center";
  const eyebrowClassName = embedded
    ? "inline-flex items-center gap-2 rounded-full border border-themed bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7355] dark:text-[#D4B47A]"
    : "inline-flex items-center gap-2 rounded-full border border-[#D8C7B5] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7355] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#D4B47A]";
  const heroHeadingClassName = embedded
    ? "mt-6 max-w-3xl text-4xl font-semibold leading-tight text-page sm:text-5xl lg:text-[3.5rem]"
    : "mt-6 max-w-3xl text-4xl font-semibold leading-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl lg:text-6xl";
  const heroBodyClassName = embedded
    ? "mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg"
    : "mt-5 max-w-2xl text-base leading-8 text-[#6E6257] dark:text-[#8A7D75] sm:text-lg";
  const benefitTextClassName = embedded
    ? "mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-muted"
    : "mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-[#6E6257] dark:text-[#8A7D75]";

  return (
    <div className={rootClassName}>
      <section className={sectionClassName}>
        <div className="pointer-events-none absolute right-[-160px] top-[-140px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(198,165,107,0.22),transparent_68%)] blur-2xl" />
        <div className="pointer-events-none absolute bottom-[-180px] left-[-160px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(216,199,181,0.34),transparent_70%)] blur-2xl" />

        <div className={contentShellClassName}>
          <div>
            <h1
              className={heroHeadingClassName}
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Curious About Better Skin? Let&apos;s Talk.
            </h1>

            <p className={heroBodyClassName}>
              Share your phone or email and our team will contact you about
              Selenite Care packages, services, procedures, and skincare product
              guidance.
            </p>

            <div className={benefitTextClassName}>
              {["No pressure", "Friendly follow-up", "Online & offline support"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#C6A56B] dark:text-[#D4B47A]" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* ── Form card — recolored to use real brand charcoal + established dark tokens ── */}
          <div className="w-full rounded-[28px] border border-[#D8C7B5] bg-[#2B2B2B] p-6 text-[#F8F5F0] shadow-[0_28px_90px_rgba(43,43,43,0.28)] dark:border-[#3D3530] dark:bg-[#1A1814] sm:p-7 lg:justify-self-end">
            {isSuccess ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF7EE] text-[#1F7A3D] dark:bg-green-950/30 dark:text-green-300">
                  <Check className="h-7 w-7" />
                </div>
                <h2
                  className="mt-5 text-3xl font-semibold text-[#F8F5F0]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  Thank you!
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#D8C7B5]">
                  We received your details. Our team will contact you soon with
                  the information you need.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-md border border-[#D8C7B5]/40 px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:border-[#C6A56B] hover:text-[#C6A56B]"
                >
                  Submit another response
                </button>
              </div>
            ) : (
              <>
                <div>
                  <div className="inline-flex items-center gap-3 rounded-full border border-[#D8C7B5]/30 bg-[#3D3530] px-3 py-2">
                    <Image
                      src="/new_logo_512x512.png"
                      alt="Selenite Care logo"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                    <div className="min-w-0 text-left">
                      <p
                        className="text-sm font-semibold text-[#F8F5F0]"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        Selenite Care
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C6A56B]">
                        Quick Contact
                      </p>
                    </div>
                  </div>
                  <h2
                    className="mt-5 text-2xl font-semibold text-[#F8F5F0]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Tell us how to reach you
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#D8C7B5]">
                    Phone or email is enough. Add both if you prefer.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="lead-name"
                      className="block text-sm font-medium text-[#F8F5F0]"
                    >
                      Name <span className="text-[#B8A89A]">(optional)</span>
                    </label>
                    <input
                      id="lead-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                      className="mt-2 h-12 w-full rounded-md border border-[#D8C7B5]/30 bg-[#1A1814] px-4 text-sm text-[#F8F5F0] outline-none transition-colors placeholder:text-[#8A7D75] focus:border-[#C6A56B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lead-phone"
                      className="block text-sm font-medium text-[#F8F5F0]"
                    >
                      Phone
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="lead-phone"
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+880..."
                        className="h-12 w-full rounded-md border border-[#D8C7B5]/30 bg-[#1A1814] pl-10 pr-4 text-sm text-[#F8F5F0] outline-none transition-colors placeholder:text-[#8A7D75] focus:border-[#C6A56B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="lead-email"
                      className="block text-sm font-medium text-[#F8F5F0]"
                    >
                      Email
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="lead-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="h-12 w-full rounded-md border border-[#D8C7B5]/30 bg-[#1A1814] pl-10 pr-4 text-sm text-[#F8F5F0] outline-none transition-colors placeholder:text-[#8A7D75] focus:border-[#C6A56B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="lead-interest"
                      className="block text-sm font-medium text-[#F8F5F0]"
                    >
                      What are you interested in?
                    </label>
                    <select
                      id="lead-interest"
                      value={interest}
                      onChange={(event) =>
                        setInterest(event.target.value as (typeof interestOptions)[number])
                      }
                      className="mt-2 h-12 w-full rounded-md border border-[#D8C7B5]/30 bg-[#1A1814] px-4 text-sm text-[#F8F5F0] outline-none transition-colors focus:border-[#C6A56B]"
                    >
                      {interestOptions.map((option) => (
                        <option key={option} value={option} className="bg-[#1A1814] text-[#F8F5F0]">
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="lead-note"
                      className="block text-sm font-medium text-[#F8F5F0]"
                    >
                      Question or concern <span className="text-[#B8A89A]">(optional)</span>
                    </label>
                    <textarea
                      id="lead-note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={4}
                      placeholder="Tell us what you want to know..."
                      className="mt-2 w-full resize-none rounded-md border border-[#D8C7B5]/30 bg-[#1A1814] px-4 py-3 text-sm text-[#F8F5F0] outline-none transition-colors placeholder:text-[#8A7D75] focus:border-[#C6A56B]"
                    />
                  </div>

                  {error ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#C6A56B] px-5 text-sm font-semibold text-[#2B2B2B] transition-colors hover:bg-[#D4B47A] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Sending..." : "Send My Details"}
                  </button>
                </form>

                <div className="mt-5 flex flex-col gap-2 rounded-xl border border-[#D8C7B5]/30 bg-[#3D3530] p-4 text-sm text-[#D8C7B5]">
                  <a
                    href="tel:+8801647660300"
                    className="inline-flex items-center gap-2 transition-colors hover:text-[#C6A56B]"
                  >
                    <Phone className="h-4 w-4 text-[#C6A56B]" />
                    +880 1647-660300
                  </a>
                  <a
                    href="https://wa.me/8801647660300"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition-colors hover:text-[#C6A56B]"
                  >
                    <MessageCircle className="h-4 w-4 text-[#C6A56B]" />
                    Message us on WhatsApp
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {!embedded ? (
        <section className="px-6 py-12">
          <div className="mx-auto flex max-w-4xl flex-col items-center rounded-[28px] border border-[#D8C7B5] bg-[#2B2B2B] px-6 py-10 text-center text-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814]">
            <h2
              className="text-3xl font-semibold"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Prefer to explore first?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D8C7B5]">
              You can still browse our memberships and contact us whenever you are
              ready. We are here to make skincare decisions easier.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/services"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#C6A56B] px-5 text-sm font-semibold text-[#2B2B2B] transition-colors hover:bg-[#D4B47A]"
              >
                View Memberships
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center rounded-md border border-[#C6A56B] px-5 text-sm font-semibold text-[#C6A56B] transition-colors hover:bg-[#C6A56B]/10"
              >
                Contact Selenite Care
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
