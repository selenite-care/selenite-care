import Image from "next/image";
import Link from "next/link";

const values = [
  {
    title: "Personalized Guidance",
    description:
      "Every recommendation is shaped around the client's lifestyle, skin concerns, and long-term goals.",
  },
  {
    title: "Steady Support",
    description:
      "We focus on practical progress through thoughtful follow-up, clear communication, and consistent care.",
  },
  {
    title: "Holistic Wellness",
    description:
      "Our approach considers skincare, habits, confidence, and everyday routines together instead of in isolation.",
  },
];

const teamMembers = [
  {
    name: "Consultant Name",
    role: "Wellness Consultant",
    description:
      "Focused on calm, practical care plans that help clients feel understood and supported from the very first conversation.",
  },
  {
    name: "Consultant Name",
    role: "Care Specialist",
    description:
      "Guides clients through their next steps with clarity, warmth, and routines that feel realistic to maintain.",
  },
  {
    name: "Consultant Name",
    role: "Client Care Lead",
    description:
      "Helps each experience feel prepared, welcoming, and easy to navigate across consultations and follow-ups.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col" style={{ backgroundColor: "#F8F5F0" }}>
      <section className="relative overflow-hidden px-6 py-20 sm:py-24">
        <div
          className="absolute left-0 top-0 h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(198, 165, 107, 0.16)" }}
        />
        <div
          className="absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(216, 199, 181, 0.24)" }}
        />

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div
              className="mb-5 inline-flex rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{
                borderColor: "#D8C7B5",
                color: "#C6A56B",
                backgroundColor: "rgba(255,255,255,0.72)",
              }}
            >
              About Selenite Care
            </div>

            <h1
              className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              A calmer, more personal way to care for skin and self.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8" style={{ color: "#6E6257" }}>
              Selenite Care was created to make expert wellness support feel
              warm, refined, and genuinely helpful. We combine attentive
              consultations, tailored guidance, and steady follow-through so
              every client feels cared for with clarity and confidence.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors hover:bg-[#B8A89A]"
                style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
              >
                Explore Memberships
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-white"
                style={{ borderColor: "#D8C7B5", color: "#2B2B2B" }}
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -left-4 top-8 h-24 w-24 rounded-full blur-2xl"
              style={{ backgroundColor: "rgba(198, 165, 107, 0.2)" }}
            />
            <div
              className="relative overflow-hidden rounded-[28px] border p-6 sm:p-8"
              style={{
                borderColor: "#D8C7B5",
                background:
                  "linear-gradient(155deg, rgba(255,255,255,0.95) 0%, rgba(245,236,224,0.9) 100%)",
                boxShadow: "0 18px 50px rgba(43, 43, 43, 0.1)",
              }}
            >
              <div className="grid gap-6 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
                <div
                  className="mx-auto flex h-36 w-36 items-center justify-center rounded-[24px] border p-4 sm:mx-0"
                  style={{
                    borderColor: "#D8C7B5",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <Image
                    src="/logo-512x512.png"
                    alt="Selenite Care logo"
                    width={112}
                    height={112}
                    className="h-auto w-full object-contain"
                    priority
                  />
                </div>

                <div>
                  <p
                    className="text-sm font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "#C6A56B" }}
                  >
                    Our Mission
                  </p>
                  <p
                    className="mt-3 text-2xl font-semibold leading-9"
                    style={{
                      color: "#2B2B2B",
                      fontFamily: "Playfair Display, serif",
                    }}
                  >
                    To make compassionate skincare and wellness consultations
                    simple to access and meaningful to experience.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Personalize", value: "Care Plans" },
                  { label: "Thoughtful", value: "Support" },
                  { label: "Long-Term", value: "Progress" },
                ].map((item) => (
                  <div
                    key={item.value}
                    className="rounded-2xl border px-4 py-4 text-center"
                    style={{
                      borderColor: "#D8C7B5",
                      backgroundColor: "rgba(255,255,255,0.72)",
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "#B8A89A" }}>
                      {item.label}
                    </p>
                    <p
                      className="mt-2 text-lg font-semibold"
                      style={{
                        color: "#2B2B2B",
                        fontFamily: "Playfair Display, serif",
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <div
              className="mb-5 h-1 w-20 rounded-full"
              style={{ backgroundColor: "#C6A56B" }}
            />
            <h2
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Our Story
            </h2>
            <p className="mt-4 text-base leading-8" style={{ color: "#6E6257" }}>
              We believe people do better with care that feels calm, guided,
              and tailored rather than overwhelming. Selenite Care grew from
              that belief: a brand built around thoughtful consultations,
              better routines, and support that stays human at every step.
            </p>
            <p className="mt-4 text-base leading-8" style={{ color: "#6E6257" }}>
              From the first booking to ongoing follow-up, our goal is to make
              skincare and wellness feel less confusing and more achievable. We
              want clients to leave each interaction with clarity, trust, and a
              plan that truly fits their life.
            </p>
          </div>

          <div className="grid gap-5">
            {values.map((value) => (
              <article
                key={value.title}
                className="rounded-2xl border p-6"
                style={{
                  backgroundColor: "#F8F5F0",
                  borderColor: "#D8C7B5",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="mt-1 h-3 w-3 rounded-full"
                    style={{ backgroundColor: "#C6A56B" }}
                  />
                  <div>
                    <h3
                      className="text-xl font-semibold"
                      style={{
                        color: "#2B2B2B",
                        fontFamily: "Playfair Display, serif",
                      }}
                    >
                      {value.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7" style={{ color: "#6E6257" }}>
                      {value.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ backgroundColor: "#F8F5F0" }}>
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <div
              className="mb-5 h-1 w-16 rounded-full"
              style={{ backgroundColor: "#C6A56B" }}
            />
            <h2
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Meet the Team
            </h2>
            <p className="mt-4 text-base leading-7" style={{ color: "#6E6257" }}>
              The people behind Selenite Care are here to make every interaction
              feel supportive, informed, and beautifully human.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {teamMembers.map((member, index) => (
              <article
                key={`${member.role}-${index}`}
                className="rounded-2xl border p-6 transition-shadow duration-200 hover:shadow-lg"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#D8C7B5",
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold"
                    style={{
                      backgroundColor: "#C6A56B",
                      color: "#F8F5F0",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    className="h-px w-16"
                    style={{ backgroundColor: "rgba(198, 165, 107, 0.45)" }}
                  />
                </div>

                <h3
                  className="mt-5 text-lg font-semibold"
                  style={{
                    color: "#2B2B2B",
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium" style={{ color: "#C6A56B" }}>
                  {member.role}
                </p>
                <p className="mt-4 text-sm leading-6" style={{ color: "#6E6257" }}>
                  {member.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
