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
      className="mt-10 space-y-5 rounded-lg border bg-white p-6"
      style={{ borderColor: "#D8C7B5" }}
    >
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium"
          style={{ color: "#2B2B2B" }}
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
          style={{
            borderColor: "#D8C7B5",
            color: "#2B2B2B",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium"
          style={{ color: "#2B2B2B" }}
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
          style={{
            borderColor: "#D8C7B5",
            color: "#2B2B2B",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium"
          style={{ color: "#2B2B2B" }}
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          className="mt-2 w-full resize-none rounded-md border bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
          style={{
            borderColor: "#D8C7B5",
            color: "#2B2B2B",
          }}
        />
      </div>

      {status ? (
        <p className="text-sm" style={{ color: "#B8A89A" }}>
          {status}
        </p>
      ) : null}

      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:opacity-90"
        style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
      >
        Send Message
      </button>
    </form>
  );
}
