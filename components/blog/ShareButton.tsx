"use client";

import { useState } from "react";
import { Camera, Mail, MessageCircle, Share2, X } from "lucide-react";

type ShareButtonProps = {
  url: string;
  title: string;
};

type PlatformShare = {
  label: string;
  href?: string;
  message?: string;
  className: string;
  icon: React.ReactNode;
};

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.26 21.92v-7.65h2.57l.39-2.98h-2.96V9.38c0-.86.24-1.45 1.48-1.45h1.58V5.27c-.27-.04-1.21-.12-2.3-.12-2.28 0-3.84 1.39-3.84 3.95v2.2H7.6v2.98h2.58v7.65c.59.05 1.09.07 1.82.07.42 0 .84-.03 1.26-.08Z" />
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.15 2 11.27c0 2.92 1.46 5.52 3.74 7.22V22l3.42-1.88c.9.25 1.85.39 2.84.39 5.52 0 10-4.15 10-9.27S17.52 2 12 2Zm1 12.45-2.55-2.72-4.98 2.72 5.47-5.8 2.61 2.72 4.91-2.72L13 14.45Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.94 8.96H3.56V20h3.38V8.96ZM5.25 4a1.96 1.96 0 1 0 0 3.92A1.96 1.96 0 0 0 5.25 4Zm15.19 9.66c0-3.04-1.62-4.45-3.79-4.45-1.75 0-2.53.96-2.97 1.64V8.96h-3.24V20h3.38v-5.46c0-1.44.27-2.84 2.06-2.84 1.77 0 1.79 1.65 1.79 2.93V20h3.38v-6.34h-.61Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2.25h3.36l-7.34 8.39 8.63 11.11h-6.76l-5.29-6.72-6.05 6.72H2.08l7.85-8.72L1.65 2.25h6.93l4.78 6.16 5.54-6.16Zm-1.18 17.54h1.86L7.57 4.1h-2L17.72 19.79Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82a5.8 5.8 0 0 0 3.39 1.09v3.27a9.04 9.04 0 0 1-3.39-.68v5.98A6.52 6.52 0 1 1 10.08 9v3.35a3.25 3.25 0 1 0 3.25 3.25V2h3.27v3.82Z" />
    </svg>
  );
}

export default function ShareButton({ url, title }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const messengerAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? "YOUR_APP_ID";

  const platforms: PlatformShare[] = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: "bg-[#1877F2] text-white",
      icon: <FacebookIcon />,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      className: "bg-[#25D366] text-white",
      icon: <MessageCircle className="h-[18px] w-[18px]" />,
    },
    {
      label: "Messenger",
      href: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=${encodeURIComponent(
        messengerAppId,
      )}&redirect_uri=${encodedUrl}`,
      className: "bg-[#0084FF] text-white",
      icon: <MessengerIcon />,
    },
    {
      label: "Instagram",
      message: "Copy link and share on Instagram",
      className: "bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white",
      icon: <Camera className="h-[18px] w-[18px]" />,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      className: "bg-[#0077B5] text-white",
      icon: <LinkedInIcon />,
    },
    {
      label: "Twitter/X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      className: "bg-black text-white",
      icon: <XIcon />,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      className: "bg-zinc-600 text-white",
      icon: <Mail className="h-[18px] w-[18px]" />,
    },
    {
      label: "TikTok",
      message: "Copy link and share on TikTok",
      className: "bg-black text-white",
      icon: <TikTokIcon />,
    },
  ];

  async function copyLink(nextMessage = "Copied!") {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setMessage(nextMessage);
    window.setTimeout(() => {
      setCopied(false);
      setMessage("");
    }, 2000);
  }

  function handleMessagePlatform(platformMessage: string) {
    void copyLink(platformMessage);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-4 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#3A3734] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#C98B78]"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-4 py-6">
          <button
            type="button"
            aria-label="Close share dialog"
            className="absolute inset-0 h-full w-full"
            onClick={() => setIsOpen(false)}
          />

          <section className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#EADDCD] bg-[#F8F5F0] p-5 shadow-2xl dark:border-[#3D3530] dark:bg-[#181513] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h2
                className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Share this article
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EADDCD] bg-white text-[#2B2B2B] transition-colors hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8]"
                aria-label="Close share dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {platforms.map((platform) =>
                platform.href ? (
                  <a
                    key={platform.label}
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${platform.className}`}
                  >
                    {platform.icon}
                    {platform.label}
                  </a>
                ) : (
                  <button
                    key={platform.label}
                    type="button"
                    onClick={() => handleMessagePlatform(platform.message ?? "Copied!")}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${platform.className}`}
                  >
                    {platform.icon}
                    {platform.label}
                  </button>
                ),
              )}
            </div>

            {message ? (
              <p className="mt-4 rounded-lg border border-[#B87B68]/30 bg-[#B87B68]/10 px-3 py-2 text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                {message}
              </p>
            ) : null}

            <div className="mt-6 rounded-xl border border-[#EADDCD] bg-white p-3 dark:border-[#3D3530] dark:bg-[#242220]">
              <label className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                Copy article link
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={url}
                  readOnly
                  className="h-11 min-w-0 flex-1 rounded-md border border-[#EADDCD] bg-[#F8F5F0] px-3 text-sm text-[#2B2B2B] outline-none dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                />
                <button
                  type="button"
                  onClick={() => void copyLink("Copied!")}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[#B87B68] px-5 text-sm font-semibold text-[#141210] transition-colors hover:bg-[#C98B78]"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
