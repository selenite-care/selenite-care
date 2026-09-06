"use client";

import { useEffect, useState } from "react";

const ONBOARDING_SEEN_KEY = "sc_onboarding_seen";
const SESSION_ID_KEY = "sc_session_id";

const intentOptions = [
  {
    id: "basic_care",
    emoji: "🌿",
    label: "Basic Care & Daily Routine",
    desc: "Build a simple, effective skincare routine",
  },
  {
    id: "target_concerns",
    emoji: "🎯",
    label: "Target Specific Concerns",
    desc: "Acne, pigmentation, sensitivity & more",
  },
  {
    id: "healthy_glow",
    emoji: "✨",
    label: "Maintain Healthy, Glowing Skin",
    desc: "Keep your skin looking its best",
  },
  {
    id: "professional_consultation",
    emoji: "🩺",
    label: "Professional Skin Consultation",
    desc: "Get expert guidance tailored to your skin",
  },
];

type OnboardingIntent = (typeof intentOptions)[number]["id"];

function getOrCreateSessionId() {
  const existingSessionId = localStorage.getItem(SESSION_ID_KEY);

  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = Math.random().toString(36).substring(2);
  localStorage.setItem(SESSION_ID_KEY, sessionId);

  return sessionId;
}

export default function SiteEntryPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<OnboardingIntent | null>(
    null,
  );

  useEffect(() => {
    if (localStorage.getItem(ONBOARDING_SEEN_KEY)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, []);

  function dismissModal() {
    setIsExiting(true);

    window.setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
    }, 220);
  }

  async function handleContinue() {
    if (!selectedIntent) {
      return;
    }

    const sessionId = getOrCreateSessionId();
    localStorage.setItem(ONBOARDING_SEEN_KEY, "1");

    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: selectedIntent,
          sessionId,
        }),
      });
    } catch {
      // Metrics must never block the visitor experience.
    }

    dismissModal();
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
    dismissModal();
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm transition-opacity duration-200 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      role="presentation"
    >
      <div
        className={`w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl transition-all duration-200 dark:bg-[#242220] ${
          isExiting
            ? "scale-95 opacity-0"
            : "scale-100 opacity-100 animate-[siteEntryModalIn_0.22s_ease-out]"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-entry-popup-title"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#B87B68] dark:text-[#D4B47A]">
            Welcome to Selenite Care
          </p>
          <h2
            id="site-entry-popup-title"
            className="mt-3 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            What brings you here today?
          </h2>
          <p className="mt-2 text-sm text-[#8C7967] dark:text-[#8A7D75]">
            Help us personalize your experience
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {intentOptions.map((option) => {
            const isSelected = selectedIntent === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedIntent(option.id)}
                className={`cursor-pointer rounded-xl border p-4 text-left transition-all hover:scale-[1.02] hover:border-[#C6A56B] hover:shadow-md dark:border-[#3D3530] ${
                  isSelected
                    ? "border-[#C6A56B] bg-[rgba(198,165,107,0.08)]"
                    : "border-[#EADDCD] bg-white dark:bg-[#242220]"
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {option.emoji}
                </span>
                <span className="mt-3 block text-sm font-bold leading-5 text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {option.label}
                </span>
                <span className="mt-2 block text-xs leading-5 text-[#8C7967] dark:text-[#8A7D75]">
                  {option.desc}
                </span>
              </button>
            );
          })}
        </div>

        {selectedIntent ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => void handleContinue()}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#2B2B2B] px-5 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#3A3734] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
            >
              Continue →
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="mt-3 inline-flex w-full items-center justify-center text-sm font-medium text-[#8C7967] hover:text-[#B87B68] dark:text-[#8A7D75] dark:hover:text-[#D4B47A]"
            >
              Skip
            </button>
          </div>
        ) : null}

        <style jsx>{`
          @keyframes siteEntryModalIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }

            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
