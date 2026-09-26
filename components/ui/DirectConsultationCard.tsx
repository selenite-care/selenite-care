import Link from "next/link";
import { Check } from "lucide-react";
import type { OneTimeConsultationPricing } from "@/lib/oneTimeConsultationPricing";

const BENEFITS = [
  "Direct online doctor consultation",
  "Root cause identification and guidance",
  "Personalized product recommendations",
  "One complimentary follow-up session",
];

export default function DirectConsultationCard({
  pricing,
  isLoading = false,
}: {
  pricing: OneTimeConsultationPricing;
  isLoading?: boolean;
}) {
  return (
    <article className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-lg border border-[#B87B68] bg-[linear-gradient(145deg,#1B1917_0%,#2B2B2B_58%,#6B542D_145%)] p-6 shadow-[0_18px_45px_rgba(43,43,43,0.2)] transition-transform duration-300 hover:-translate-y-1 sm:p-7">
      <div>
        <h3
          className="text-3xl font-semibold text-[#F8F5F0]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Direct Consultation
        </h3>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-3" aria-label="Loading consultation price">
              <div className="h-6 w-36 animate-pulse rounded bg-white/15" />
              <div className="h-10 w-44 animate-pulse rounded bg-white/15" />
            </div>
          ) : (
            <>
              {pricing.isOfferActive && pricing.offerLabel ? (
                <span className="inline-flex rounded-full bg-[#E63946] px-3 py-1 text-[11px] font-bold text-white">
                  {"\u2728"} {pricing.offerLabel}
                </span>
              ) : null}
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <p
                  className="text-4xl font-bold text-[#D4B47A]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {pricing.currentPrice.toLocaleString("en-US")} BDT
                </p>
                {pricing.isOfferActive ? (
                  <span className="pb-1 text-sm font-semibold text-[#B8AAA0] line-through">
                    {pricing.originalPrice.toLocaleString("en-US")} BDT
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-[#B8AAA0]">one-time payment</p>
            </>
          )}
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {BENEFITS.map((benefit) => (
          <li
            key={benefit}
            className="flex items-start gap-3 text-sm leading-6 text-[#F0EDE8]"
          >
            <Check
              className="mt-1 h-4 w-4 shrink-0 text-[#B87B68]"
              aria-hidden="true"
            />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-7">
        <Link
          href="/one-time-consultation"
          className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#B87B68] px-5 text-sm font-bold text-[#211E1A] transition-colors hover:bg-[#E4C98D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8F5F0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2B2B]"
        >
          Book Now {"\u2014"} {pricing.currentPrice.toLocaleString("en-US")} BDT
        </Link>
      </div>
    </article>
  );
}
