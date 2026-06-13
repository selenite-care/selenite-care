export const revalidate = 3600;

const sections = [
  {
    title: "Membership Validity & Membership Fee",
    body:
      "The membership shall remain valid for the specified duration from the date of activation. Platinum Membership must be renewed upon every year to continue enjoying member benefits. Membership fees are generally non-refundable once paid. In exceptional circumstances, any refund decision shall be made solely at the discretion of Selenite Care, and such decision shall be considered final.",
  },
  {
    title: "Personal Use Only",
    body:
      "Membership is strictly intended for the registered member only. Membership benefits may not be transferred, sold, shared, or assigned to any other individual.",
  },
  {
    title: "Consultation Service",
    body:
      "Consultation services provided by Selenite Care are intended for skincare guidance and aesthetic consultation purposes only. These services do not constitute medical diagnosis, prescription, treatment, or emergency medical care.",
  },
  {
    title: "Appointment Policy",
    body:
      "Members are required to book an appointment prior to receiving consultation services. Requests for appointment rescheduling should be made at least 24 hours before the scheduled appointment time.",
  },
  {
    title: "Customer Information",
    body:
      "Members are responsible for providing accurate and up-to-date personal information. Selenite Care shall not be held responsible for any issues arising from inaccurate or incomplete information provided by the member.",
  },
  {
    title: "Product Recommendations",
    body:
      "Product recommendations will be provided based on the member’s skin type, skin condition, and concerns. Results may vary from person to person, and no specific outcome or result is guaranteed.",
  },
  {
    title: "Membership Benefits",
    body:
      "Selenite Care reserves the right to modify, add, suspend, or discontinue membership benefits at any time. Members will be informed of significant changes whenever reasonably possible.",
  },
  {
    title: "Code of Conduct",
    body:
      "Members are expected to maintain respectful and professional behavior towards Selenite Care staff, aestheticians, and other members. Any abusive, inappropriate, or disruptive conduct may result in suspension or termination of membership.",
  },
  {
    title: "Membership Cancellation",
    body:
      "Selenite Care reserves the right to suspend or cancel any membership in cases of fraud, misuse, submission of false information, or violation of these Terms & Conditions.",
  },
  {
    title: "Privacy Policy",
    body:
      "All personal information provided by members will be kept confidential and securely maintained. Information will not be disclosed to third parties except where required by law or with the member’s consent.",
  },
  {
    title: "Limitation of Liability",
    body:
      "Skincare outcomes may vary depending on individual factors, including lifestyle, hormones, diet, medical conditions, and adherence to recommended routines. Selenite Care does not guarantee specific results or improvements within any particular timeframe.",
  },
];

export default function TermsAndConditionsPage() {
  return (
    <main
      className="min-h-screen px-6 py-16 sm:py-20"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <div className="mx-auto w-full max-w-4xl">
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
          Terms & Conditions
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8" style={{ color: "#6E6257" }}>
          This is a placeholder Terms & Conditions page for Selenite Care. You
          can update the exact wording later with your final approved text.
        </p>

        <div className="mt-10 space-y-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border bg-white p-6"
              style={{ borderColor: "#D8C7B5" }}
            >
              <h2
                className="text-2xl font-semibold"
                style={{
                  color: "#2B2B2B",
                  fontFamily: "Playfair Display, serif",
                }}
              >
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: "#6E6257" }}>
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
