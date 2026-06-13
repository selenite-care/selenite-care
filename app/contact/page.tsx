import ContactFormClient from "./ContactFormClient";

export const revalidate = 3600;

export default function ContactPage() {
  return (
    <section
      className="flex flex-1 px-6 py-16"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="max-w-2xl">
            <div
              className="mb-5 h-1 w-16 rounded-full"
              style={{ backgroundColor: "#C6A56B" }}
            />
            <h1
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Contact Us
            </h1>
            <p className="mt-4 text-base leading-7" style={{ color: "#B8A89A" }}>
              Send us a message and the Selenite Care team will follow up with
              you.
            </p>
          </div>

          <ContactFormClient />
        </div>

        <aside
          className="h-fit rounded-lg border bg-white p-6"
          style={{ borderColor: "#D8C7B5" }}
        >
          <div
            className="mb-4 h-1 w-14 rounded-full"
            style={{ backgroundColor: "#C6A56B" }}
          />
          <h2
            className="text-lg font-semibold"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Contact Details
          </h2>
          <div className="mt-6 space-y-5 text-sm">
            <div>
              <p className="font-medium" style={{ color: "#2B2B2B" }}>
                Email
              </p>
              <p className="mt-1" style={{ color: "#B8A89A" }}>
                careselenite@gmail.com
              </p>
            </div>
            <div>
              <p className="font-medium" style={{ color: "#2B2B2B" }}>
                Phone
              </p>
              <p className="mt-1" style={{ color: "#B8A89A" }}>
                +88 (01) 681517169
              </p>
            </div>
            <div>
              <p className="font-medium" style={{ color: "#2B2B2B" }}>
                Location
              </p>
              <p className="mt-1" style={{ color: "#B8A89A" }}>
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
