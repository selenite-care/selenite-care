"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

export default function SiteEntryPopup() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onClick={() => setIsVisible(false)}
    >
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Selenite Care announcement"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#2B2B2B] shadow-md transition-colors hover:bg-[#F8F5F0] dark:bg-[#242220]/95 dark:text-[#F0EDE8] dark:hover:bg-[#1A1814]"
          aria-label="Close announcement"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="relative w-full">
          <Image
            src="/offers/2ya.jpeg"
            alt="Selenite Care announcement"
            width={420}
            height={420}
            sizes="(max-width: 480px) 92vw, 420px"
            className="h-auto w-full"
            priority
          />
        </div>
      </div>
    </div>
  );
}
