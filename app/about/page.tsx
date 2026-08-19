import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import AnimatedTeamSection from "@/components/about/AnimatedTeamSection";
import AnimatedAboutHero from "@/components/about/AnimatedAboutHero";

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
];

function getTeamMemberImage(member: { name: string; image: string | null }) {
  if (member.name.toLowerCase().includes("safna")) {
    return "/doctors/dr safna2.jpeg";
  }

  return member.image;
}

async function getTeamMembers() {
  try {
    const doctors = await db.doctor.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        designation: true,
        bio: true,
        image: true,
      },
    });

    if (doctors.length === 0) {
      return teamMembers.map((member, index) => ({
        id: `fallback-${index}`,
        name: member.name,
        role: member.role,
        image: member.image,
        description: member.description,
        bio: null,
      }));
    }

    return doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      role: doctor.designation,
      image: doctor.image,
      description: doctor.bio ?? "Doctor profile coming soon.",
      bio: doctor.bio,
    }));
  } catch {
    return teamMembers.map((member, index) => ({
      id: `fallback-${index}`,
      name: member.name,
      role: member.role,
      image: member.image,
      description: member.description,
      bio: null,
    }));
  }
}

export default async function AboutPage() {
  const team = await getTeamMembers();
  const animatedTeam = team.map((member) => ({
  id: member.id,
  name: member.name,
  role: member.role,
  image: getTeamMemberImage(member),
  description: member.description,
}));

  return (
    <div className="bg-page text-page flex flex-1 flex-col">
    <AnimatedAboutHero />

      <section className="bg-card px-6 py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <div
              className="mb-5 h-1 w-20 rounded-full"
              style={{ backgroundColor: "#B87B68" }}
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
                className="rounded-2xl border border-[#EADDCD] bg-[#F8F5F0] p-6 dark:border-[#3D3530] dark:bg-[#242220]"
                style={{
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="mt-1 h-3 w-3 rounded-full bg-[#B87B68]"
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
      className="text-sm font-medium uppercase tracking-[0.2em] text-[#B87B68] dark:text-[#D4B47A]"
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
      className="mx-auto mt-6 max-w-2xl text-lg text-[#884F38] dark:text-[#8A7D75]"
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
      className="text-4xl text-[#B87B68] dark:text-[#D4B47A]"
      style={{
        fontFamily: "Playfair Display, serif",
      }}
      >
      &ldquo;&rdquo;
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
      className="mt-6 text-sm uppercase tracking-[0.2em] text-[#884F38] dark:text-[#8A7D75]"
      >
      SELENITE CARE
      </p>
      </div>
      </section>

      <AnimatedTeamSection team={animatedTeam} />
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

      <p className="mt-4 text-lg text-[#EADDCD] dark:text-[#8A7D75]">
      Book your consultation today and receive personalized guidance from
      experienced skincare professionals.
      </p>

      <Link
      href="/services"
      className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-[#B87B68] px-8 text-sm font-medium text-[#F8F5F0] transition-opacity hover:opacity-90 dark:bg-[#D4B47A] dark:text-[#141210]"
      >
        Explore Memberships
      </Link>
      </div>
      </section>
    </div>
  );
}
