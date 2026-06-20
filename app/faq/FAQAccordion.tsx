"use client";

import { useState } from "react";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

type FAQCategory = {
  category: string;
  items: FAQItem[];
};

export default function FAQAccordion({
  groups,
}: {
  groups: FAQCategory[];
}) {
  const [openItemId, setOpenItemId] = useState<string | null>(groups[0]?.items[0]?.id ?? null);

  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <section key={group.category}>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
            {group.category}
          </p>

          <div className="mt-5 space-y-4">
            {group.items.map((item) => {
              const isOpen = openItemId === item.id;

              return (
                <article
                  key={item.id}
                  className="bg-card border-themed overflow-hidden rounded-2xl border shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenItemId((current) =>
                        current === item.id ? null : item.id,
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                    aria-expanded={isOpen}
                  >
                    <span className="text-page text-base font-semibold leading-7 sm:text-lg">
                      {item.question}
                    </span>

                    <span
                      className="shrink-0 text-[var(--gold)] transition-transform duration-300"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      <svg
                        aria-hidden="true"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>

                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                    }}
                  >
                    <div className="overflow-hidden">
                      <div
                        className="text-muted border-t px-5 py-5 text-sm leading-7 sm:px-6 sm:text-base"
                        style={{ borderColor: "var(--border)" }}
                      >
                        {item.answer}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
