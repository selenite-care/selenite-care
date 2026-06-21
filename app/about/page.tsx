import Image from "next/image";
import Link from "next/link";

export const revalidate = 3600;

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
    name: "Dr. Safna Mehreen",
    role: "Wellness Consultant",
    image: "/doctors/dr safna2.jpeg",
    description:
      "Focused on calm, practical care plans that help clients feel understood and supported from the very first conversation.",
  },
  {
    name: "Dr. Hritisha",
    role: "Wellness Consultant",
    image: "/doctors/dr hritisha.jpeg",
    description:
      "Guides clients through their next steps with clarity, warmth, and routines that feel realistic to maintain.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-page text-page flex flex-1 flex-col">
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
              className="mb-5 inline-flex rounded-full border border-[#D8C7B5] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#C6A56B] dark:border-[#3D3530] dark:bg-[#242220]/80 dark:text-[#D4B47A]"
              style={{
              }}
            >
              About Selenite Care
            </div>

            <h1
              className="max-w-3xl text-4xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl lg:text-6xl"
              style={{
                fontFamily: "Playfair Display, serif",
              }}
            >
              A calmer, more personal way to care for skin and self.
            </h1>

            <p className="text-muted mt-6 max-w-2xl text-lg leading-8">
              Selenite Care is a professional skincare consultation platform dedicated to addressing acne, dark spots, pigmentation, and other skin concerns through personalized guidance from certified aestheticians. Our mission is to help every client achieve healthier, clearer, and more confident skin with expert care and customized solutions.
            </p><br></br>
            <hr className="border-[#D8C7B5] dark:border-[#3D3530]"></hr><br></br>
            <div className="mt-6 flex items-center gap-4">
            <div
            className="h-px w-12 bg-[#C6A56B]"
            />
            <span
            className="text-sm uppercase tracking-[0.2em] text-[#C6A56B] dark:text-[#D4B47A]"
            >
             Founded in 2024
            </span>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--sidebar)] px-6 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
              >
                Explore Memberships
              </Link>
              <Link
                href="/contact"
                className="border-themed text-page inline-flex h-12 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
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
              className="relative overflow-hidden rounded-[28px] border border-[#D8C7B5] p-6 dark:border-[#3D3530] sm:p-8"
              style={{
                background:
                  "linear-gradient(155deg, rgba(255,255,255,0.95) 0%, rgba(245,236,224,0.9) 100%)",
                boxShadow: "0 18px 50px rgba(43, 43, 43, 0.1)",
              }}
            >
              <div className="grid gap-6 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
                <div
                  className="mx-auto flex h-36 w-36 items-center justify-center rounded-[24px] border border-[#D8C7B5] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220] sm:mx-0"
                  style={{
                  }}
                >
                  <Image
                    src="/new_logo_512x512.png"
                    alt="Selenite Care logo"
                    width={112}
                    height={112}
                    className="h-auto w-full object-contain"
                    priority
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C6A56B] dark:text-[#D4B47A]">
                    Our Mission
                  </p>
                  <p
                    className="mt-3 text-2xl font-semibold leading-9 text-[#2B2B2B] dark:text-[#000000]"
                    style={{
                      fontFamily: "Playfair Display, serif",
                    }}
                  >
                    To make compassionate skincare and wellness consultations
                    simple to access and meaningful to experience.
                  </p>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
  <div className="text-center">
    <p
      className="text-3xl font-bold text-[#C6A56B] dark:text-[#D4B47A]"
      style={{
        fontFamily: "Playfair Display, serif",
      }}
    >
      1000+
    </p>
    <p className="text-xs uppercase tracking-wider text-[#B8A89A] dark:text-[#8A7D75]">
      Consultations
    </p>
  </div>

  <div className="text-center">
    <p
      className="text-3xl font-bold text-[#C6A56B] dark:text-[#D4B47A]"
      style={{
        fontFamily: "Playfair Display, serif",
      }}
    >
      99%
    </p>
    <p className="text-xs uppercase tracking-wider text-[#B8A89A] dark:text-[#8A7D75]">
      Satisfaction
    </p>
  </div>

  <div className="text-center">
    <p
      className="text-3xl font-bold text-[#C6A56B] dark:text-[#D4B47A]"
      style={{
        fontFamily: "Playfair Display, serif",
      }}
    >
      24/7
    </p>
    <p className="text-xs uppercase tracking-wider text-[#B8A89A] dark:text-[#8A7D75]">
      Support
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
                    className="rounded-2xl border border-[#D8C7B5] bg-white/70 px-4 py-4 text-center dark:border-[#3D3530] dark:bg-[#1A1814]/80"
                    style={{
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8A89A] dark:text-[#8A7D75]">
                      {item.label}
                    </p>
                    <p
                      className="mt-2 text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                      style={{
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

      <section className="bg-card px-6 py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <div
              className="mb-5 h-1 w-20 rounded-full"
              style={{ backgroundColor: "#C6A56B" }}
            />
            <h2
              className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
              style={{
                fontFamily: "Playfair Display, serif",
              }}
            >
              Our Story
            </h2>
            <p className="mt-4 text-base leading-8 text-[#6E6257] dark:text-[#8A7D75]">
              We believe people do better with care that feels calm, guided,
              and tailored rather than overwhelming. Selenite Care grew from
              that belief: a brand built around thoughtful consultations,
              better routines, and support that stays human at every step.
            </p>
            <p className="mt-4 text-base leading-8 text-[#6E6257] dark:text-[#8A7D75]">
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
                className="rounded-2xl border border-[#D8C7B5] bg-[#F8F5F0] p-6 dark:border-[#3D3530] dark:bg-[#242220]"
                style={{
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="mt-1 h-3 w-3 rounded-full bg-[#C6A56B]"
                  />
                  <div>
                    <h3
                      className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                      style={{
                        fontFamily: "Playfair Display, serif",
                      }}
                    >
                      {value.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                      {value.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="px-6 py-20 bg-white dark:bg-[#242220]">
      <div className="mx-auto max-w-5xl text-center">
    <span
      className="text-sm font-medium uppercase tracking-[0.2em] text-[#C6A56B] dark:text-[#D4B47A]"
    >
      Client Community
    </span>
    <h2
      className="mt-4 text-4xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8]"
      style={{ fontFamily: "Playfair Display, serif" }}
    >
      Join Our Private Wellness Community
    </h2>
    <p
      className="mx-auto mt-6 max-w-2xl text-lg text-[#B8A89A] dark:text-[#8A7D75]"
    >
      Connect with other members, share your skincare journey,
      read real experiences, and receive exclusive wellness updates.
    </p>
    
     <a href="https://www.facebook.com/groups/1487525968606577/"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-8 inline-flex h-12 items-center justify-center rounded-md px-8 text-sm font-medium bg-[#1877F2] text-white hover:bg-[#1666d8] transition-colors"
    >
      Join Facebook Community
    </a>
  </div>
      </section>
      <section className="bg-card px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">
      <p
      className="text-4xl text-[#C6A56B] dark:text-[#D4B47A]"
      style={{
        fontFamily: "Playfair Display, serif",
      }}
      >
      ""
      </p>

      <blockquote
      className="mt-4 text-2xl leading-relaxed text-[#2B2B2B] dark:text-[#F0EDE8]"
      style={{
        fontFamily: "Playfair Display, serif",
      }}
      >
      Beautiful skin begins with understanding, consistency, and care that
      feels personal.
      </blockquote>

      <p
      className="mt-6 text-sm uppercase tracking-[0.2em] text-[#B8A89A] dark:text-[#8A7D75]"
      >
      SELENITE CARE
      </p>
      </div>
      </section>

      <section className="bg-page px-6 py-16">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <div
              className="mb-5 h-1 w-16 rounded-full"
              style={{ backgroundColor: "#C6A56B" }}
            />
            <h2
              className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
              style={{
                fontFamily: "Playfair Display, serif",
              }}
            >
              Meet the Team
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6E6257] dark:text-[#8A7D75]">
              The people behind Selenite Care are here to make every interaction
              feel supportive, informed, and beautifully human.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {teamMembers.map((member, index) => (
              <article
                key={`${member.role}-${index}`}
                className="rounded-2xl border border-[#D8C7B5] bg-white p-6 transition-shadow duration-200 hover:shadow-lg dark:border-[#3D3530] dark:bg-[#242220]"
                style={{
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-[#D8C7B5] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814]">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-lg font-semibold"
                        style={{
                          backgroundColor: "#C6A56B",
                          color: "#F8F5F0",
                        }}
                      >
                        {member.name
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </div>
                    )}
                  </div>
                  <div
                    className="mt-12 h-px flex-1"
                    style={{ backgroundColor: "rgba(198, 165, 107, 0.45)" }}
                  />
                </div>

                <h3
                  className="mt-5 text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-[#C6A56B] dark:text-[#D4B47A]">
                  {member.role}
                </p>
                <p className="mt-4 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]">
                  {member.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#2B2B2B] px-6 py-20 dark:bg-[#141210]">
      <div className="mx-auto max-w-4xl text-center">
      <h2
      className="text-4xl font-semibold text-[#F8F5F0] dark:text-[#F0EDE8]"
      style={{
        fontFamily: "Playfair Display, serif",
      }}
      >
      Ready to Begin Your Skin Journey?
      </h2>

      <p className="mt-4 text-lg text-[#D8C7B5] dark:text-[#8A7D75]">
      Book your consultation today and receive personalized guidance from
      experienced skincare professionals.
      </p>

      <Link
      href="/services"
      className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-[#C6A56B] px-8 text-sm font-medium text-[#F8F5F0] transition-opacity hover:opacity-90 dark:bg-[#D4B47A] dark:text-[#141210]"
      >
        Explore Memberships
      </Link>
      </div>
      </section>
    </div>
  );
}
