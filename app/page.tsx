import Link from "next/link";
import ViewportAnimatedSection from "@/components/ui/ViewportAnimatedSection";

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
    title: "Fill Form",
    description: "Share the details we need to prepare for your session.",
  },
  {
    title: "Pay",
    description: "Secure your appointment with a simple payment flow.",
  },
  {
    title: "Get Consultation",
    description: "Meet with your consultant and receive personalized support.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section style={{ backgroundColor: "#F8F5F0" }} className="px-6 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <h1
              style={{
                fontFamily: "Playfair Display, serif",
              }}
              className="glitter-text text-4xl font-bold tracking-tight sm:text-5xl"
            >
              Compassionate care for your everyday wellness.
            </h1>
            <p style={{ color: "#B8A89A" }} className="mt-6 text-lg leading-8">
              Schedule personalized support with Selenite Care and get the
              attention you need, right when you need it.
            </p>
            <Link
              href="/booking"
              style={{
                backgroundColor: "#2B2B2B",
                color: "#F8F5F0",
              }}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors duration-200 hover:bg-[#B8A89A]"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section style={{ backgroundColor: "#FFFFFF" }} className="px-6 py-16">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#2B2B2B",
              }}
              className="horizontal-nudge text-3xl font-bold tracking-tight"
            >
              Why Choose Us
            </h2>
            <p style={{ color: "#B8A89A" }} className="mt-4 text-base leading-7">
              Care should feel clear, calm, and easy to access.
            </p>
          </div>

          <ViewportAnimatedSection className="feature-card-trigger mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#D8C7B5",
                  borderWidth: "1px",
                  animationDelay: `${(features.length - 1 - index) * 400}ms`,
                }}
                className="feature-card-slide-in rounded-lg p-6 transition-all duration-200 hover:shadow-lg"
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "#C6A56B",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      color: "#F8F5F0",
                      fontSize: "20px",
                    }}
                  >
                    ✓
                  </span>
                </div>
                <h3
                  style={{ color: "#2B2B2B" }}
                  className="mt-4 text-lg font-semibold"
                >
                  {feature.title}
                </h3>
                <p style={{ color: "#B8A89A" }} className="mt-3 text-sm leading-6">
                  {feature.description}
                </p>
              </article>
            ))}
          </ViewportAnimatedSection>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ backgroundColor: "#F8F5F0" }} className="px-6 py-16">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#2B2B2B",
              }}
              className="horizontal-nudge text-3xl font-bold tracking-tight"
            >
              How It Works
            </h2>
            <p style={{ color: "#B8A89A" }} className="mt-4 text-base leading-7">
              Three simple steps from booking to consultation.
            </p>
          </div>

          <ViewportAnimatedSection className="step-card-trigger mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#C6A56B",
                  borderWidth: "1px",
                  animationDelay: `${index * 400}ms`,
                }}
                className="step-card-slide-in rounded-lg p-6"
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#C6A56B",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#F8F5F0",
                    fontSize: "24px",
                    fontWeight: "bold",
                  }}
                >
                  {index + 1}
                </div>
                <h3
                  style={{ color: "#2B2B2B" }}
                  className="mt-5 text-lg font-semibold"
                >
                  {step.title}
                </h3>
                <p style={{ color: "#B8A89A" }} className="mt-3 text-sm leading-6">
                  {step.description}
                </p>
              </article>
            ))}
          </ViewportAnimatedSection>
        </div>
      </section>
    </div>
  );
}

