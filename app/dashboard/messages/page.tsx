"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, Video } from "lucide-react";
import { toast } from "sonner";
import { formatTimeOnly } from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

type MessageItem = {
  id: string;
  conversationId: string;
  content: string;
  messageType: string;
  isReadByClient: boolean;
  createdAt: string;
  senderRole: string;
  senderLabel: string;
};

type MessagesResponse = {
  conversationId?: string;
  messages?: MessageItem[];
  error?: string;
};

type SendMessageResponse = {
  message?: MessageItem;
  error?: string;
};

const POLL_INTERVAL_MS = 10_000;
const googleMeetUrlPattern =
  /https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i;

function getMessagesSignature(messages: MessageItem[]) {
  return messages
    .map((message) => `${message.id}:${message.createdAt}:${message.content}`)
    .join("|");
}

function getGoogleMeetUrl(content: string) {
  return content.match(googleMeetUrlPattern)?.[0] ?? null;
}

function GoogleMeetCard({ url }: { url: string }) {
  return (
    <div className="rounded-xl border border-green-200 border-l-4 border-l-green-600 bg-white p-4 text-left shadow-sm dark:border-green-900/50 dark:border-l-green-500 dark:bg-[#1A1814]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300">
          <Video className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#2B2B2B] dark:text-[#F0EDE8]">
            Google Meet Link
          </p>
          <p className="mt-0.5 text-xs text-[#6E6257] dark:text-[#8A7D75]">
            Secure video consultation
          </p>
        </div>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-bold text-white transition-colors hover:bg-green-700"
      >
        Join Meeting
      </a>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const googleMeetUrl = getGoogleMeetUrl(content);

  if (googleMeetUrl) {
    return <GoogleMeetCard url={googleMeetUrl} />;
  }

  return <>{content}</>;
}

export default function DashboardMessagesPage() {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  async function loadMessages(options: { showLoading?: boolean } = {}) {
    if (options.showLoading) {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/messages", {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | MessagesResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to load messages.");
      }

      const nextMessages = data?.messages ?? [];
      setMessages((current) =>
        getMessagesSignature(current) === getMessagesSignature(nextMessages)
          ? current
          : nextMessages,
      );
      setError("");
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load messages.";
      setError(message);
    } finally {
      if (options.showLoading) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadMessages({ showLoading: true });

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadMessages();
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: isLoading ? "auto" : "smooth",
      });
    });
  }, [messages]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || isSending) {
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: trimmedContent,
          messageType: "TEXT",
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | SendMessageResponse
        | null;

      if (!response.ok || !data?.message) {
        throw new Error(data?.error ?? "Unable to send message.");
      }

      setMessages((current) => [...current, data.message as MessageItem]);
      setContent("");
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "Unable to send message.";
      setError(message);
      toast.error("Unable to send message.", {
        description: message,
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#EADDCD] bg-white shadow-sm dark:border-[#3D3530] dark:bg-[#1A1814]">
      <header className="border-b border-[#EADDCD] bg-[#F8F5F0] px-5 py-4 dark:border-[#3D3530] dark:bg-[#242220] sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B87B68] text-base font-bold text-[#141210]">
            SC
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Selenite Care
              </h1>
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.14)]" />
            </div>
            <p className="mt-1 text-xs leading-5 text-[#6E6257] dark:text-[#8A7D75] sm:text-sm">
              Our team typically responds within a few hours
            </p>
          </div>
        </div>
      </header>

      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F8F5F0] px-4 py-5 dark:bg-[#141210] sm:px-6"
      >
        {isLoading ? (
          <p className="text-sm text-[#6E6257] dark:text-[#8A7D75]">
            Loading messages...
          </p>
        ) : null}

        {!isLoading && messages.length === 0 ? (
          <div className="flex min-h-full items-center justify-center text-center">
            <div className="max-w-sm rounded-2xl border border-[#EADDCD] bg-white px-6 py-8 dark:border-[#3D3530] dark:bg-[#242220]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#B87B68]/15 text-sm font-bold text-[#B87B68]">
                SC
              </div>
              <h2
                className="mt-4 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Welcome!
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]">
                Send us a message and our team will respond shortly.
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {messages.map((message) => {
            const isClientMessage = message.senderRole === "CLIENT";

            return (
              <article
                key={message.id}
                className={`flex gap-3 ${
                  isClientMessage ? "justify-end" : "justify-start"
                }`}
              >
                {!isClientMessage ? (
                  <div className="mt-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B87B68] text-xs font-bold text-[#141210]">
                    SC
                  </div>
                ) : null}

                <div
                  className={`max-w-[82%] sm:max-w-[70%] ${
                    isClientMessage ? "text-right" : "text-left"
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold text-[#884F38] dark:text-[#8A7D75]">
                    {isClientMessage ? "You" : "Selenite Care"}
                  </p>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      isClientMessage
                        ? "rounded-br-md bg-[#B87B68] text-[#141210]"
                        : "rounded-bl-md border border-[#EADDCD] bg-white text-[#2B2B2B] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8]"
                    }`}
                  >
                    <MessageContent content={message.content} />
                  </div>
                  <p className="mt-1 text-[11px] text-[#8C7967] dark:text-[#8A7D75]">
                    {formatTimeOnly(message.createdAt)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleSendMessage}
        className="flex items-end gap-3 border-t border-[#EADDCD] bg-white px-4 py-4 dark:border-[#3D3530] dark:bg-[#242220] sm:px-6"
      >
        <label htmlFor="dashboard-message-input" className="sr-only">
          Type your message
        </label>
        <textarea
          id="dashboard-message-input"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type your message..."
          rows={1}
          className="min-h-12 flex-1 resize-none rounded-xl border border-[#EADDCD] bg-[#F8F5F0] px-4 py-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#8C7967] focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#141210] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={isSending || !content.trim()}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
            isSending || !content.trim()
              ? "cursor-not-allowed bg-[#EADDCD] text-[#8C7967] dark:bg-[#3D3530] dark:text-[#8A7D75]"
              : "bg-[#2B2B2B] text-[#B87B68] hover:bg-[#3A3734] dark:bg-[#2B2B2B] dark:text-[#D4B47A] dark:hover:bg-[#3A3734]"
          }`}
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </section>
  );
}
