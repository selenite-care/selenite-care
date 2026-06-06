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
    <div className="flex flex-1 flex-col" style={{ backgroundColor: "#F8F5F0" }}>
      <section className="px-6 py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div
              className="mb-5 h-1 w-20 rounded-full"
              style={{ backgroundColor: "#C6A56B" }}
            />
            <h1
              className="text-4xl font-semibold tracking-tight sm:text-5xl"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Care built around steadiness, trust, and real support.
            </h1>
            <p className="mt-6 text-lg leading-8" style={{ color: "#B8A89A" }}>
              Selenite Care began with a simple belief: wellness support should
              feel personal, accessible, and grounded. We created a calmer way
              to book consultations, share your needs, and receive guidance that
              fits your life.
            </p>
          </div>

          <div
            className="rounded-lg border bg-white p-6"
            style={{ borderColor: "#D8C7B5" }}
          >
            <div
              className="mb-4 h-1 w-14 rounded-full"
              style={{ backgroundColor: "#C6A56B" }}
            />
            <p
              className="text-sm font-medium uppercase"
              style={{ color: "#B8A89A" }}
            >
              Our Mission
            </p>
            <p
              className="mt-4 text-2xl font-semibold leading-9"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              To make compassionate wellness consultations simple to access and
              meaningful to experience.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <div
              className="mb-5 h-1 w-16 rounded-full"
              style={{ backgroundColor: "#C6A56B" }}
            />
            <h2
              className="text-3xl font-semibold tracking-tight"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Our Team
            </h2>
            <p className="mt-4 text-base leading-7" style={{ color: "#B8A89A" }}>
              Meet the consultants who help turn care into a thoughtful,
              supportive experience.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {teamMembers.map((member, index) => (
              <article
                key={`${member.role}-${index}`}
                className="rounded-lg border p-6"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#D8C7B5",
                }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold"
                  style={{
                    backgroundColor: "#C6A56B",
                    color: "#F8F5F0",
                  }}
                >
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold" style={{ color: "#2B2B2B" }}>
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium" style={{ color: "#C6A56B" }}>
                  {member.role}
                </p>
                <p className="mt-4 text-sm leading-6" style={{ color: "#B8A89A" }}>
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
