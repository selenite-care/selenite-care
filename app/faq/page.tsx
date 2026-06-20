import { getFAQsByCategory } from "@/lib/faq";
import FAQAccordion from "./FAQAccordion";

export const dynamic = "force-static";

export default function FAQPage() {
  const groupedFaqs = getFAQsByCategory();
  const allFaqs = groupedFaqs.flatMap((group) => group.items);
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />

      <section className="bg-page text-page min-h-screen px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1
              className="text-page text-4xl font-semibold sm:text-5xl"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Frequently Asked Questions
            </h1>
            <p className="text-muted mx-auto mt-4 max-w-2xl text-base leading-7 sm:text-lg">
              Find answers to common questions about Selenite Care.
            </p>
          </div>

          <div className="mt-14">
            <FAQAccordion groups={groupedFaqs} />
          </div>
        </div>
      </section>
    </>
  );
}
