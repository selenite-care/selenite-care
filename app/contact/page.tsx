import ContactFormClient from "./ContactFormClient";

export const revalidate = 3600;

export default function ContactPage() {
  return (
    <section className="bg-page text-page flex flex-1 px-6 py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="max-w-2xl">
            <div className="mb-5 h-1 w-16 rounded-full bg-[var(--gold)]" />
            <h1
              className="text-page text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Contact Us
            </h1>
            <p className="text-muted mt-4 text-base leading-7">
              Send us a message and the Selenite Care team will follow up with
              you.
            </p>
          </div>

          <ContactFormClient />
        </div>

        <aside className="bg-card border-themed h-fit rounded-lg border p-6">
          <div className="mb-4 h-1 w-14 rounded-full bg-[var(--gold)]" />
          <h2
            className="text-page text-lg font-semibold"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Contact Details
          </h2>
          <div className="mt-6 space-y-5 text-sm">
            <div>
              <p className="text-page font-medium">
                Email
              </p>
              <p className="text-muted mt-1">
                careselenite@gmail.com
              </p>
            </div>
            <div>
              <p className="text-page font-medium">
                Phone
              </p>
              <p className="text-muted mt-1">
                +88 (01) 681517169
              </p>
            </div>
            <div>
              <p className="text-page font-medium">
                Location
              </p>
              <p className="text-muted mt-1">
                Level-6, Building-1, Golden Shower, Mazar Road, Dhaka,
                Bangladesh
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
