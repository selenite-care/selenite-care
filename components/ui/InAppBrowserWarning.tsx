"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { isInAppBrowser } from "@/lib/detectBrowser";

const DISMISS_STORAGE_KEY = "selenite_in_app_browser_warning_dismissed";

export default function InAppBrowserWarning() {
  const [shouldShowWarning, setShouldShowWarning] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const isDismissed =
      window.sessionStorage.getItem(DISMISS_STORAGE_KEY) === "true";

    setShouldShowWarning(isInAppBrowser() && !isDismissed);
  }, []);

  if (!shouldShowWarning) {
    return null;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleOpenInBrowser() {
    window.location.href = window.location.href;
  }

  function handleDismiss() {
    window.sessionStorage.setItem(DISMISS_STORAGE_KEY, "true");
    setShouldShowWarning(false);
  }

  return (
    <div className="fixed left-0 right-0 top-0 z-[9999] border-b border-[#2B2B2B]/10 bg-[#B87B68] px-4 py-3 text-[#2B2B2B] shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 pr-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1 text-sm font-medium leading-6">
            <p>
              You are using an in-app browser. Google Sign-In is not available
              here. Please open this page in Chrome or Safari for the best
              experience.
            </p>
            <p className="hidden">
              আপনি একটি ইন-অ্যাপ ব্রাউজারে আছেন। এখানে Google Sign-In কাজ করে
              না। সেরা অভিজ্ঞতার জন্য Chrome বা Safari-তে খুলুন।
            </p>
            <p>
              আপনি একটি ইন-অ্যাপ ব্রাউজারে আছেন। এখানে Google Sign-In কাজ করে
              না। সেরা অভিজ্ঞতার জন্য Chrome বা Safari-তে খুলুন।
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleOpenInBrowser}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-semibold text-[#F8F5F0] transition-opacity hover:opacity-90"
          >
            Open in Browser
          </button>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#2B2B2B]/30 bg-[#F8F5F0] px-4 text-sm font-semibold text-[#2B2B2B] transition-opacity hover:opacity-90"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2B2B2B]/10 text-[#2B2B2B] transition-colors hover:bg-[#2B2B2B]/20"
        aria-label="Dismiss in-app browser warning"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
