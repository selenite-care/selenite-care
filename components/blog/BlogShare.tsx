"use client";

import { useState } from "react";
import { Check, Copy, Send, Share2 } from "lucide-react";

type BlogShareProps = {
  title: string;
  url: string;
};

export default function BlogShare({ title, url }: BlogShareProps) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }

    await handleCopy();
  }

  async function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="mt-8 rounded-[24px] border border-[#EADDCD] bg-card px-5 py-5 dark:border-[#3D3530] dark:bg-[#242220]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
            Share this article
          </p>
          <p className="mt-1 text-xs text-[#8C7967] dark:text-[#8A7D75]">
            Send this skincare insight to someone who might need it.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleNativeShare()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-4 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#3A3734] dark:bg-[#B87B68] dark:text-[#141210]"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#EADDCD] text-[#1877F2] transition-colors hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530]"
            aria-label="Share on Facebook"
          >
            <span className="text-base font-bold leading-none">f</span>
          </a>
          <a
            href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#EADDCD] text-[#25D366] transition-colors hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530]"
            aria-label="Share on WhatsApp"
          >
            <Send className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#EADDCD] text-[#2B2B2B] transition-colors hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:text-[#F0EDE8]"
            aria-label="Copy article link"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}
