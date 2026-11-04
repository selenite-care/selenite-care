"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

type ProgramTone = "consultation" | "classic" | "signature";

type ProgramAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const TONE_STYLES: Record<
  ProgramTone,
  {
    card: string;
    eyebrow: string;
    title: string;
    price: string;
    muted: string;
    benefit: string;
    check: string;
    details: string;
    primary: string;
  }
> = {
  
consultation: {
  card: "group/consultation isolate border-[#A4C4B8] bg-[radial-gradient(ellipse_at_12%_0%,rgba(255,255,255,0.95)_0%,transparent_45%),radial-gradient(ellipse_at_100%_85%,rgba(93,159,137,0.22)_0%,transparent_55%),linear-gradient(155deg,#F0F8F3_0%,#DCEBE5_48%,#C4DDD2_100%)] shadow-[0_20px_55px_rgba(38,78,67,0.16)] hover:shadow-[0_28px_70px_rgba(38,78,67,0.25)]",

  eyebrow: "border-[#426C60]/25 bg-white/45 text-[#264E43] shadow-sm backdrop-blur-md",

  title: "text-[#264E43]",

  price: "text-[#264E43] drop-shadow-[0_2px_10px_rgba(255,255,255,0.65)]",

  muted: "text-[#56796E]",

  benefit: "text-[#35594E]",

  check: "text-[#426C60]",

  details: "border-[#86AFA0]/65 bg-white/25 text-[#264E43] backdrop-blur-sm hover:border-[#426C60]/60 hover:bg-white/55",

  primary: "bg-[linear-gradient(110deg,#264E43_0%,#4F8572_48%,#264E43_100%)] bg-[length:200%_100%] text-white shadow-[0_8px_25px_rgba(38,78,67,0.25)] transition-all duration-500 hover:bg-right hover:shadow-[0_12px_30px_rgba(38,78,67,0.35)]",
},

  
classic: {
  card: "group/classic isolate border-[#CDA3A1] bg-[radial-gradient(ellipse_at_15%_0%,rgba(255,255,255,0.85)_0%,transparent_42%),radial-gradient(ellipse_at_100%_75%,rgba(190,116,130,0.20)_0%,transparent_50%),linear-gradient(155deg,#F9EEEE_0%,#EBD9D8_48%,#E5C8CA_100%)] shadow-[0_20px_55px_rgba(121,67,77,0.18)] hover:shadow-[0_28px_70px_rgba(121,67,77,0.27)]",

  eyebrow: "border-[#B78A91]/45 bg-white/35 text-[#79434D] shadow-sm backdrop-blur-md",

  title: "text-[#60343D]",

  price: "text-[#79434D] drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]",

  muted: "text-[#89575E]",

  benefit: "text-[#603F45]",

  check: "text-[#9B5E68]",

  details: "border-[#B78A91]/65 bg-white/20 text-[#79434D] backdrop-blur-sm hover:border-[#79434D]/60 hover:bg-white/45",

  primary: "bg-[linear-gradient(110deg,#79434D_0%,#A86F7B_48%,#79434D_100%)] bg-[length:200%_100%] text-white shadow-[0_8px_25px_rgba(121,67,77,0.25)] transition-all duration-500 hover:bg-right hover:shadow-[0_12px_30px_rgba(121,67,77,0.35)]",
},

  
signature: {
  card: "group/signature isolate border-[#BFA078] bg-[radial-gradient(ellipse_at_10%_0%,rgba(117,157,148,0.24)_0%,transparent_45%),radial-gradient(ellipse_at_100%_85%,rgba(212,180,140,0.15)_0%,transparent_50%),linear-gradient(155deg,#36565A_0%,#263F46_42%,#152A30_100%)] shadow-[0_22px_60px_rgba(15,40,46,0.30)] hover:shadow-[0_30px_80px_rgba(15,40,46,0.45)]",

  eyebrow: "border-[#D4B48C]/50 bg-[#D4B48C]/10 text-[#F2DFC5] shadow-[0_0_16px_rgba(212,180,140,0.10)] backdrop-blur-md",

  title: "text-[#F2DFC5]",

  price: "text-[#D4B48C] drop-shadow-[0_0_18px_rgba(212,180,140,0.20)]",

  muted: "text-[#C8B8A6]",

  benefit: "text-[#F0E6DA]",

  check: "text-[#D4B48C]",

  details: "border-[#D4B48C]/50 bg-white/5 text-[#F2DFC5] backdrop-blur-sm hover:border-[#E8CFAE] hover:bg-[#D4B48C]/15",

  primary: "bg-[linear-gradient(110deg,#B99165_0%,#E8CFAE_48%,#B99165_100%)] bg-[length:200%_100%] text-[#192F36] shadow-[0_8px_28px_rgba(212,180,140,0.20)] transition-all duration-500 hover:bg-right hover:shadow-[0_12px_34px_rgba(212,180,140,0.35)]",
},
};

export default function ProgramOptionCard({
  tone,
  badge,
  title,
  price,
  originalPrice,
  duration,
  paymentNote,
  offerBadge,
  statusBadge,
  benefits,
  detailsLabel = "View all benefits",
  onViewDetails,
  primaryAction,
}: {
  tone: ProgramTone;
  badge: string;
  title: string;
  price: string;
  originalPrice?: string;
  duration: string;
  paymentNote?: string;
  offerBadge?: string;
  statusBadge?: string;
  benefits: readonly string[];
  detailsLabel?: string;
  onViewDetails: () => void;
  primaryAction: ProgramAction;
}) {
  const styles = TONE_STYLES[tone];

  return (
    <article
      className={`relative flex h-full min-h-[470px] min-w-0 flex-col overflow-hidden rounded-lg border-2 p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7 ${styles.card}`}
    >
      
{tone === "consultation" && (
  <>
    {/* Soft luminous botanical glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/45 blur-[75px]"
    />

    {/* Jade ambient lighting */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#6EA993]/25 blur-[85px]"
    />

    {/* Glass-like surface reflection */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-2 rounded-md border border-white/45"
    />

    {/* Animated elegant shimmer */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      <div
        className="absolute -inset-y-1/2 -left-full w-1/2 rotate-[25deg] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 blur-xl transition-all duration-[1200ms] ease-in-out group-hover/consultation:left-[150%] group-hover/consultation:opacity-100 motion-reduce:transition-none"
      />
    </div>

    {/* Tiny pearl sparkles */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-9 top-28 h-1 w-1 rounded-full bg-white shadow-[0_0_12px_3px_rgba(255,255,255,0.8)]"
    />

    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-9 top-[58%] h-0.5 w-0.5 rounded-full bg-white/90 shadow-[0_0_9px_2px_rgba(255,255,255,0.7)]"
    />
  </>
)}

      {tone === "classic" && (
  <>
    {/* Soft pearl glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/40 blur-[75px]"
    />

    {/* Rose-gold ambient glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#B77C89]/20 blur-[85px]"
    />

    {/* Subtle animated light sweep */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      <div
        className="absolute -inset-y-1/2 -left-full w-1/2 rotate-[25deg] bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 blur-xl transition-all duration-[1200ms] ease-in-out group-hover/classic:left-[150%] group-hover/classic:opacity-100 motion-reduce:transition-none"
      />
    </div>

    {/* Fine decorative highlights */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-8 top-28 h-1 w-1 rounded-full bg-white shadow-[0_0_12px_3px_rgba(255,255,255,0.75)]"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-8 top-[55%] h-0.5 w-0.5 rounded-full bg-white/80 shadow-[0_0_9px_2px_rgba(255,255,255,0.6)]"
    />
  </>
)}

{tone === "signature" && (
  <>
    {/* Warm champagne-gold ambient glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#D4B48C]/15 blur-[85px]"
    />

    {/* Deep emerald atmospheric glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#6F9A8D]/20 blur-[90px]"
    />

    {/* Delicate metallic inner border */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-2 rounded-md border border-[#D4B48C]/25"
    />

    {/* Fine golden highlight across the top */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-10 top-2 h-px bg-gradient-to-r from-transparent via-[#F2DFC5]/70 to-transparent"
    />

    {/* Animated golden light sweep */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      <div
        className="absolute -inset-y-1/2 -left-full w-1/2 rotate-[25deg] bg-gradient-to-r from-transparent via-[#E8CFAE]/25 to-transparent opacity-0 blur-xl transition-all duration-[1400ms] ease-in-out group-hover/signature:left-[150%] group-hover/signature:opacity-100 motion-reduce:transition-none"
      />
    </div>

    {/* Subtle golden sparkle */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-10 top-28 h-1 w-1 rounded-full bg-[#F2DFC5] shadow-[0_0_14px_3px_rgba(212,180,140,0.75)]"
    />

    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-9 top-[57%] h-0.5 w-0.5 rounded-full bg-[#E8CFAE] shadow-[0_0_10px_2px_rgba(212,180,140,0.65)]"
    />

    {/* Gold bottom-edge reflection */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-12 bottom-1 h-px bg-gradient-to-r from-transparent via-[#D4B48C]/55 to-transparent"
    />
  </>
)}

      {tone === "classic" ? (
        <>
          <div
  className="pointer-events-none absolute inset-x-0 top-0 h-[164px] border-b border-[#CDA3A1]/25 bg-[linear-gradient(135deg,rgba(255,255,255,0.30),rgba(195,129,142,0.12))]"
  aria-hidden="true"
/>
          <div
            className="pointer-events-none absolute right-5 top-5 h-16 w-16 border-r border-t border-[#9B5E61]/35 dark:border-[#E8B8B6]/25"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-9 top-9 h-10 w-10 border-r border-t border-[#FFFDFC]/75 dark:border-[#FFF8F7]/20"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-2 rounded-md border border-[#FFFFFF]/65 dark:border-white/5"
            aria-hidden="true"
          />
        </>
      ) : null}

      <div
        className={`absolute inset-x-0 top-0 z-20 h-1.5 ${
          tone === "consultation"
  ? "bg-[#426C60]"
  : tone === "classic"
    ? "bg-[#9B5E61]"
    : "bg-[#D4B48C]"
        }`}
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-8 flex-wrap items-start justify-between gap-2">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${styles.eyebrow}`}
        >
          {badge}
        </span>
        {statusBadge ? (
          <span className="inline-flex rounded-full bg-[#E63946] px-3 py-1 text-[10px] font-bold uppercase text-white">
            {statusBadge}
          </span>
        ) : null}
      </div>

      <h3
        className={`relative z-10 mt-5 min-h-[72px] text-3xl font-semibold leading-tight ${styles.title}`}
        style={{ fontFamily: "Playfair Display, serif" }}
      >
        {title}
      </h3>

      <div className="relative z-10 mt-5 min-h-[92px]">
        {offerBadge ? (
          <span className="inline-flex rounded-full bg-[#E63946] px-3 py-1 text-[11px] font-bold text-white">
            {offerBadge}
          </span>
        ) : null}
        <div className={`flex flex-wrap items-end gap-3 ${offerBadge ? "mt-3" : ""}`}>
          <p
            className={`text-4xl font-bold leading-none ${styles.price}`}
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {price}
          </p>
          {originalPrice ? (
            <span className={`pb-1 text-sm font-semibold line-through ${styles.muted}`}>
              {originalPrice}
            </span>
          ) : null}
        </div>
        <div className={`mt-2 flex flex-wrap items-center gap-2 text-sm ${styles.muted}`}>
          <span>{duration}</span>
          {paymentNote ? (
            <>
              <span aria-hidden="true">&middot;</span>
              <span>{paymentNote}</span>
            </>
          ) : null}
        </div>
      </div>

      <ul className="relative z-10 mt-6 space-y-3">
        {benefits.slice(0, 3).map((benefit) => (
          <li
            key={benefit}
            className={`flex min-w-0 items-start gap-3 text-sm leading-6 ${styles.benefit}`}
          >
            <Check
              className={`mt-1 h-4 w-4 shrink-0 ${styles.check}`}
              aria-hidden="true"
            />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="relative z-10 mt-auto space-y-3 pt-7">
        <button
          type="button"
          onClick={onViewDetails}
          className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors ${styles.details}`}
        >
          {detailsLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>

        {primaryAction.href && !primaryAction.disabled ? (
          <Link
            href={primaryAction.href}
            className={`inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-center text-sm font-bold transition-colors ${styles.primary}`}
          >
            {primaryAction.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className={`inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-center text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${styles.primary}`}
          >
            {primaryAction.label}
          </button>
        )}
      </div>
    </article>
  );
}
