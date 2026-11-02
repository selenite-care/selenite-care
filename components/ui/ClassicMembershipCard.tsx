import Link from "next/link";
import { Check } from "lucide-react";
import { CLASSIC_MEMBERSHIP_BENEFITS } from "@/lib/membershipDiscounts";

export default function ClassicMembershipCard({ price }: { price: number }) {
  return (
    <article className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-lg border-2 border-[#B87B68] bg-white shadow-[0_18px_45px_rgba(184,123,104,0.16)] transition-transform duration-300 hover:-translate-y-1 dark:bg-[#242220]">
      <div className="bg-[linear-gradient(135deg,#B87B68_0%,#C98F7D_55%,#8F5D50_100%)] px-6 py-5 sm:px-7">
        <span className="inline-flex rounded-full border border-white/40 bg-[#2B2B2B]/20 px-3 py-1 text-[11px] font-bold uppercase text-white">
          1 Month Guidance
        </span>
        <h3
          className="mt-4 text-3xl font-semibold text-white"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Classic
        </h3>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <p
            className="text-4xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {price.toLocaleString("en-US")} BDT
          </p>
          <span className="inline-flex rounded-full border border-[#B87B68]/50 bg-[#B87B68]/10 px-3 py-1 text-xs font-semibold text-[#884F38] dark:text-[#E5B7AA]">
            1 Month
          </span>
        </div>

        <ul className="mt-6 space-y-3">
          {CLASSIC_MEMBERSHIP_BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3 text-sm leading-6 text-[#5F524A] dark:text-[#D9C9BD]"
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
            href="/membership/payment?tier=CLASSIC"
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#B87B68] px-5 text-sm font-bold text-[#211E1A] transition-colors hover:bg-[#C98F7D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87B68] focus-visible:ring-offset-2 dark:ring-offset-[#242220]"
          >
            Get Classic Membership
          </Link>
        </div>
      </div>
    </article>
  );
}
