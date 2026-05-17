"use client";

import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setStatus("Thanks for reaching out. We will get back to you soon.");
  }

  return (
    <section className="flex flex-1 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Contact Us
            </h1>
            <p className="mt-4 text-base leading-7 text-foreground/70">
              Send us a message and the Selenite Care team will follow up with
              you.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-5 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-foreground"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                className="mt-2 w-full resize-none rounded-md border border-black/10 bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
              />
            </div>

            {status ? <p className="text-sm text-foreground/70">{status}</p> : null}

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
            >
              Send Message
            </button>
          </form>
        </div>

        <aside className="h-fit rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">
            Contact Details
          </h2>
          <div className="mt-6 space-y-5 text-sm">
            <div>
              <p className="font-medium text-foreground">Email</p>
              <p className="mt-1 text-foreground/70">careselenite@gmail.com</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Phone</p>
              <p className="mt-1 text-foreground/70">+88 (01) 00000-0000</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Location</p>
              <p className="mt-1 text-foreground/70">
                Dhaka, Bangladesh
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
