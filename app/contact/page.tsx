import ContactFormClient from "./ContactFormClient";
import LeadsPageClient from "@/app/leads/LeadsPageClient";

import ContactIntro, {
  ContactDetailsCard,
} from "@/components/contact/ContactIntro";

import WereHereSection from "@/components/contact/WereHereSection";

export const revalidate = 3600;

export default function ContactPage() {
  return (
    <main className="bg-page text-page flex flex-1 flex-col">
      <section className="relative overflow-hidden px-6 py-16 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#B87B68]/5 blur-[90px]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#D4B47A]/5 blur-[100px]"
        />

        <div className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="flex min-h-[280px] items-center">
            <ContactIntro />
          </div>

          <div className="lg:sticky lg:top-24">
            <ContactDetailsCard />
          </div>
        </div>
      </section>

      <WereHereSection />

      <section className="relative overflow-hidden px-6 py-14 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#B87B68]/5 blur-[90px]"
        />

        <div className="relative mx-auto w-full max-w-3xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B87B68] dark:text-[#D4B47A]">
              Contact Form
            </p>
            <h2
              className="mt-3 text-3xl font-semibold text-page sm:text-4xl"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Send Us a Message
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">
              Share your question, concern, or request. Our team will reply as
              soon as possible.
            </p>
          </div>

          <ContactFormClient />
        </div>
      </section>

      <LeadsPageClient embedded />
    </main>
  );
}
