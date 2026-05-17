const teamMembers = [
  {
    name: "Consultant Name",
    role: "Wellness Consultant",
    description: "Focused on calm, practical care plans for everyday wellness.",
  },
  {
    name: "Consultant Name",
    role: "Care Specialist",
    description: "Supports clients with thoughtful guidance and follow-through.",
  },
  {
    name: "Consultant Name",
    role: "Client Care Lead",
    description: "Helps make each appointment clear, prepared, and welcoming.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <section className="px-6 py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Care built around steadiness, trust, and real support.
            </h1>
            <p className="mt-6 text-lg leading-8 text-foreground/70">
              Selenite Care began with a simple belief: wellness support should
              feel personal, accessible, and grounded. We created a calmer way
              to book consultations, share your needs, and receive guidance that
              fits your life.
            </p>
          </div>

          <div className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
            <p className="text-sm font-medium uppercase text-foreground/60">
              Our Mission
            </p>
            <p className="mt-4 text-2xl font-semibold leading-9 text-foreground">
              To make compassionate wellness consultations simple to access and
              meaningful to experience.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-background px-6 py-16">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Our Team
            </h2>
            <p className="mt-4 text-base leading-7 text-foreground/70">
              Meet the consultants who help turn care into a thoughtful,
              supportive experience.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {teamMembers.map((member, index) => (
              <article
                key={`${member.role}-${index}`}
                className="rounded-lg border border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-lg font-semibold text-background">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-foreground/70">
                  {member.role}
                </p>
                <p className="mt-4 text-sm leading-6 text-foreground/70">
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
