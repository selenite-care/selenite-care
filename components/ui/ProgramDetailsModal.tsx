"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { useEffect } from "react";

export default function ProgramDetailsModal({
  title,
  subtitle,
  benefits,
  actionLabel,
  actionHref,
  actionDisabled = false,
  onClose,
}: {
  title: string;
  subtitle: string;
  benefits: readonly string[];
  actionLabel: string;
  actionHref?: string;
  actionDisabled?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close program details"
        onClick={onClose}
        className="absolute inset-0 bg-[#2B2B2B]/75"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="program-details-title"
        className="relative z-10 flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-[#EADDCD] bg-[#F8F5F0] shadow-[0_28px_80px_rgba(43,43,43,0.28)] dark:border-[#3D3530] dark:bg-[#242220]"
      >
        <div className="border-b border-[#EADDCD] px-6 py-5 dark:border-[#3D3530]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EADDCD] text-[#2B2B2B] transition-colors hover:bg-white dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#1A1814]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <h2
            id="program-details-title"
            className="pr-12 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {title}
          </h2>
          <p className="mt-2 text-sm text-[#6E6257] dark:text-[#B8AAA0]">
            {subtitle}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <ul className="space-y-4">
            {benefits.map((benefit) => (
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
        </div>

        <div className="border-t border-[#EADDCD] p-5 dark:border-[#3D3530]">
          {actionHref && !actionDisabled ? (
            <Link
              href={actionHref}
              className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#B87B68] px-5 text-sm font-bold text-[#211E1A] transition-colors hover:bg-[#C98F7D]"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-[#CFC5BA] px-5 text-sm font-bold text-[#6E6257] opacity-60 dark:bg-[#3D3530] dark:text-[#8A7D75]"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
