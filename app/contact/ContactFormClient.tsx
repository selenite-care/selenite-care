"use client";

import { FormEvent, useState } from "react";

export default function ContactFormClient() {
  const [status, setStatus] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setStatus("Thanks for reaching out. We will get back to you soon.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border-themed mt-10 space-y-5 rounded-lg border p-6"
    >
      <div>
        <label htmlFor="name" className="text-page block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="bg-card border-themed text-page mt-2 h-11 w-full rounded-md border px-3 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
        />
      </div>

      <div>
        <label htmlFor="email" className="text-page block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="bg-card border-themed text-page mt-2 h-11 w-full rounded-md border px-3 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
        />
      </div>

      <div>
        <label htmlFor="message" className="text-page block text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          className="bg-card border-themed text-page mt-2 w-full resize-none rounded-md border px-3 py-3 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
        />
      </div>

      {status ? (
        <p className="text-muted text-sm">
          {status}
        </p>
      ) : null}

      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--sidebar)] px-5 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
      >
        Send Message
      </button>
    </form>
  );
}
