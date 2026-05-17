import Link from "next/link";

const features = [
  {
    title: "Personalized Care",
    description: "Support shaped around your needs, schedule, and goals.",
  },
  {
    title: "Simple Booking",
    description: "Choose a service, reserve a time, and get clear next steps.",
  },
  {
    title: "Trusted Guidance",
    description: "Thoughtful consultations focused on practical wellness.",
  },
];

const steps = [
  {
    title: "Pay",
    description: "Secure your appointment with a simple payment flow.",
  },
  {
    title: "Fill Form",
    description: "Share the details we need to prepare for your session.",
  },
  {
    title: "Get Consultation",
    description: "Meet with your consultant and receive personalized support.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Compassionate care for your everyday wellness.
            </h1>
            <p className="mt-6 text-lg leading-8 text-foreground/70">
              Schedule personalized support with Selenite Care and get the
              attention you need, right when you need it.
            </p>
            <Link
              href="/booking"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-background px-6 py-16">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Why Choose Us
            </h2>
            <p className="mt-4 text-base leading-7 text-foreground/70">
              Care should feel clear, calm, and easy to access.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-white/5"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              How It Works
            </h2>
            <p className="mt-4 text-base leading-7 text-foreground/70">
              Three simple steps from booking to consultation.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
