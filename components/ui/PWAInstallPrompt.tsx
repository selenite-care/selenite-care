"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISS_STORAGE_KEY = "selenite_pwa_install_prompt_dismissed_until";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isDismissed() {
  const dismissedUntil = Number(
    window.localStorage.getItem(DISMISS_STORAGE_KEY) ?? "0",
  );

  return Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();
}

function storeDismissal() {
  window.localStorage.setItem(
    DISMISS_STORAGE_KEY,
    String(Date.now() + DISMISS_DURATION_MS),
  );
}

export default function PWAInstallPrompt() {
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();

      if (!isMobileDevice() || isStandaloneMode() || isDismissed()) {
        return;
      }

      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  async function handleInstall() {
    if (!installPromptEvent) {
      return;
    }

    await installPromptEvent.prompt();
    await installPromptEvent.userChoice.catch(() => null);
    setInstallPromptEvent(null);
    setIsVisible(false);
  }

  function handleDismiss() {
    storeDismissal();
    setIsVisible(false);
  }

  if (!isVisible || !installPromptEvent) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-[70] rounded-2xl border border-[#EADDCD] border-t-4 border-t-[#B87B68] bg-[#F8F5F0] p-4 shadow-[0_16px_50px_rgba(43,43,43,0.22)] dark:border-[#3D3530] dark:border-t-[#D4B47A] dark:bg-[#1A1814] md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2B2B2B] text-sm font-bold text-[#F8F5F0] dark:bg-[#B87B68] dark:text-[#141210]">
          SC
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Selenite Care
          </p>
          <p className="mt-1 text-sm leading-5 text-[#6E6257] dark:text-[#8A7D75]">
            Install Selenite Care app for quick access
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#3A3734] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
        >
          Install App
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-semibold text-[#8C7967] transition-colors hover:text-[#2B2B2B] dark:text-[#8A7D75] dark:hover:text-[#F0EDE8]"
        >
          Not Now
        </button>
      </div>
    </div>
  );
}
