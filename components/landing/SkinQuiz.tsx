"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Droplets,
  HeartPulse,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";

type QuizStep = {
  key: keyof QuizAnswers;
  question: string;
  options: {
    label: string;
    icon: LucideIcon;
  }[];
};

type QuizAnswers = {
  concern: string;
  skinType: string;
  previousConsultation: string;
  goal: string;
};

type LeadResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
};

const quizSteps: QuizStep[] = [
  {
    key: "concern",
    question: "What is your primary skin concern?",
    options: [
      { label: "Acne & Breakouts", icon: CircleDot },
      { label: "Dark Spots & Pigmentation", icon: Sparkles },
      { label: "Dry & Dehydrated Skin", icon: Droplets },
      { label: "Oily Skin", icon: Sun },
      { label: "Sensitive Skin", icon: ShieldCheck },
      { label: "Aging & Fine Lines", icon: HeartPulse },
    ],
  },
  {
    key: "skinType",
    question: "How would you describe your skin type?",
    options: [
      { label: "Oily", icon: Sun },
      { label: "Dry", icon: Droplets },
      { label: "Combination", icon: Sparkles },
      { label: "Normal", icon: CheckCircle2 },
      { label: "Sensitive", icon: ShieldCheck },
      { label: "Not Sure", icon: CircleDot },
    ],
  },
  {
    key: "previousConsultation",
    question: "Have you had a professional skin consultation before?",
    options: [
      { label: "Yes, and it helped", icon: CheckCircle2 },
      { label: "Yes, but I didn't see results", icon: HeartPulse },
      { label: "No, this would be my first", icon: Sparkles },
    ],
  },
  {
    key: "goal",
    question: "What is your skin goal?",
    options: [
      { label: "Clear acne fast", icon: CircleDot },
      { label: "Even skin tone", icon: Sparkles },
      { label: "Hydrate & glow", icon: Droplets },
      { label: "Reduce signs of aging", icon: HeartPulse },
      { label: "Understand my skin better", icon: ShieldCheck },
    ],
  },
];

const initialAnswers: QuizAnswers = {
  concern: "",
  skinType: "",
  previousConsultation: "",
  goal: "",
};

function trackMetaPixelEvent(eventName: string) {
  if (typeof window !== "undefined" && typeof window.fbq !== "undefined") {
    window.fbq("track", eventName);
  }
}

export default function SkinQuiz() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(initialAnswers);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [formLoadTime, setFormLoadTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFormLoadTime(String(Date.now()));
  }, []);

  const isResultStep = stepIndex >= quizSteps.length;
  const activeStep = quizSteps[stepIndex];
  const progressPercentage = Math.min(
    ((Math.min(stepIndex + 1, quizSteps.length) / quizSteps.length) * 100),
    100,
  );

  const recommendationReason = useMemo(() => {
    const concern = answers.concern || "your skin concern";
    const skinType = answers.skinType || "unique";

    return `Our certified aestheticians specialize in ${concern.toLowerCase()} and will create a personalized plan for your ${skinType.toLowerCase()} skin.`;
  }, [answers.concern, answers.skinType]);

  function handleAnswer(value: string) {
    if (!activeStep) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [activeStep.key]: value,
    }));
    setStepIndex((current) => Math.min(current + 1, quizSteps.length));
  }

  function handleBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError("Please provide your name and phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!executeRecaptcha) {
        throw new Error("Security check is still loading. Please try again.");
      }

      const recaptchaToken = await executeRecaptcha("skin_quiz_lead");
      const response = await fetch("/api/landing/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          interest: "Signature Membership",
          website,
          formLoadTime,
          recaptchaToken,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | LeadResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to send your details right now.");
      }

      trackMetaPixelEvent("Lead");
      setIsSubmitted(true);
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
    <section className="mx-auto w-full max-w-5xl rounded-[28px] border border-[#EADDCD] bg-white p-5 shadow-[0_22px_60px_rgba(43,43,43,0.08)] dark:border-[#3D3530] dark:bg-[#242220] sm:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B87B68] dark:text-[#D4B47A]">
            {isResultStep ? "Result" : `Step ${stepIndex + 1} of 4`}
          </p>
          {!isResultStep && stepIndex > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[#EADDCD] px-3 text-xs font-semibold text-[#6E6257] transition-colors hover:border-[#B87B68] hover:text-[#B87B68] dark:border-[#3D3530] dark:text-[#8A7D75] dark:hover:border-[#D4B47A] dark:hover:text-[#D4B47A]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
          ) : null}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EFE7DC] dark:bg-[#1A1814]">
          <div
            className="h-full rounded-full bg-[#B87B68] transition-all duration-500 dark:bg-[#D4B47A]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isResultStep && activeStep ? (
          <motion.div
            key={activeStep.key}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <h2
              className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {activeStep.question}
            </h2>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {activeStep.options.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleAnswer(option.label)}
                    className="group flex min-h-20 items-center gap-4 rounded-2xl border border-[#EADDCD] bg-[#F8F5F0] p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#B87B68] hover:bg-white hover:shadow-[0_16px_35px_rgba(184,123,104,0.16)] dark:border-[#3D3530] dark:bg-[#1A1814] dark:hover:border-[#D4B47A] dark:hover:bg-[#242220]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#B87B68]/15 text-[#B87B68] transition-colors group-hover:bg-[#B87B68] group-hover:text-[#F8F5F0] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A] dark:group-hover:bg-[#D4B47A] dark:group-hover:text-[#141210]">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div>
              <h2
                className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Your Skin Profile is Ready!
              </h2>
              <p className="mt-4 text-base leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                Based on your answers, here's what we recommend:
              </p>

              <div className="mt-6 rounded-2xl border border-[#B87B68] bg-[#FFF8EE] p-5 dark:border-[#D4B47A] dark:bg-[#2A241D]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B87B68] dark:text-[#D4B47A]">
                  Recommended Membership
                </p>
                <h3
                  className="mt-3 text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  Signature Membership
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                  {recommendationReason}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/membership/payment?tier=SIGNATURE"
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-md bg-[#B87B68] px-5 py-3 text-center text-sm font-bold text-[#F8F5F0] transition-colors hover:bg-[#D4B47A] hover:text-[#141210]"
                >
                  Get Signature Membership — 990 BDT
                </Link>
                <Link
                  href="/services"
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#EADDCD] px-5 py-3 text-sm font-semibold text-[#2B2B2B] transition-colors hover:border-[#B87B68] hover:text-[#B87B68] dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:border-[#D4B47A] dark:hover:text-[#D4B47A]"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#EADDCD] bg-[#F8F5F0] p-5 dark:border-[#3D3530] dark:bg-[#1A1814]">
              {isSubmitted ? (
                <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#B87B68]/15 text-[#B87B68] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
                    <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <p
                    className="mt-4 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Thank you!
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]">
                    Our team will call you about your skin profile soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    style={{ display: "none" }}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                  <p
                    className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Want us to call you about your skin profile?
                  </p>

                  <div>
                    <label
                      htmlFor="skin-quiz-name"
                      className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                    >
                      Name
                    </label>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B87B68]" />
                      <input
                        id="skin-quiz-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="h-12 w-full rounded-md border border-[#EADDCD] bg-white pl-10 pr-4 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#884F38] focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="skin-quiz-phone"
                      className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                    >
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B87B68]" />
                      <input
                        id="skin-quiz-phone"
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="h-12 w-full rounded-md border border-[#EADDCD] bg-white pl-10 pr-4 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#884F38] focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
                        placeholder="Your phone number"
                        required
                      />
                    </div>
                  </div>

                  {error ? (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-5 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#3A3734] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {isSubmitting ? "Sending..." : "Submit"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
