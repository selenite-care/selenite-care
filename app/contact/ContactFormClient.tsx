"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useState } from "react";

export default function ContactFormClient() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setStatus("");
    setError("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to send your message.");
      }

      form.reset();
      setStatus("Thanks for reaching out. We will get back to you soon.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send your message.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.75,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="bg-card border-themed relative mt-10 space-y-5 overflow-hidden rounded-2xl border p-6 shadow-[0_18px_50px_rgba(43,43,43,0.05)] sm:p-7"
    >
      {/* soft ambient sheen */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-24 -skew-x-12 bg-white/20 blur-xl"
        animate={{
          left: ["-35%", "130%"],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatDelay: 5,
          ease: "easeInOut",
        }}
      />

      <div className="relative space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <label
            htmlFor="name"
            className="text-page block text-sm font-medium"
          >
            Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="bg-card border-themed text-page mt-2 h-11 w-full rounded-md border px-3 text-sm outline-none transition-all duration-300 focus:-translate-y-[1px] focus:border-[var(--gold)] focus:shadow-[0_8px_24px_rgba(184,123,104,0.08)] focus:ring-1 focus:ring-[var(--gold)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.18 }}
        >
          <label
            htmlFor="email"
            className="text-page block text-sm font-medium"
          >
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="bg-card border-themed text-page mt-2 h-11 w-full rounded-md border px-3 text-sm outline-none transition-all duration-300 focus:-translate-y-[1px] focus:border-[var(--gold)] focus:shadow-[0_8px_24px_rgba(184,123,104,0.08)] focus:ring-1 focus:ring-[var(--gold)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.26 }}
        >
          <label
            htmlFor="message"
            className="text-page block text-sm font-medium"
          >
            Message
          </label>

          <textarea
            id="message"
            name="message"
            rows={6}
            required
            className="bg-card border-themed text-page mt-2 w-full resize-none rounded-md border px-3 py-3 text-sm outline-none transition-all duration-300 focus:-translate-y-[1px] focus:border-[var(--gold)] focus:shadow-[0_8px_24px_rgba(184,123,104,0.08)] focus:ring-1 focus:ring-[var(--gold)]"
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-red-600 dark:text-red-300"
            >
              {error}
            </motion.p>
          ) : null}

          {status ? (
            <motion.p
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-muted text-sm"
            >
              {status}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="relative inline-flex h-11 items-center justify-center overflow-hidden rounded-md bg-[var(--sidebar)] px-5 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-12 -skew-x-12 bg-white/20 blur-lg"
            animate={{
              left: ["-50%", "140%"],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
          />

          <span className="relative">
            {isSubmitting ? "Sending..." : "Send Message"}
          </span>
        </motion.button>
      </div>
    </motion.form>
  );
}