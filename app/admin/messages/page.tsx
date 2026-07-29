"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Send, Video } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import { formatTimeOnly } from "@/lib/dateUtils";

type InboxConversation = {
  id: string;
  clientId: string;
  clientName: string | null;
  clientPhone: string | null;
  clientImage: string | null;
  lastMessage: string | null;
  isRead: boolean;
  preview: string;
};

type InboxResponse = {
  conversations?: InboxConversation[];
  unreadCount?: number;
  error?: string;
};

type ConversationMessage = {
  id: string;
  content: string;
  messageType: string;
  createdAt: string;
  senderRole: string;
  senderName: string;
};

type ConversationResponse = {
  conversationId?: string;
  messages?: ConversationMessage[];
  error?: string;
};

type SendMessageResponse = {
  message?: ConversationMessage;
  error?: string;
};

const INBOX_POLL_INTERVAL_MS = 15_000;
const MESSAGES_POLL_INTERVAL_MS = 10_000;
const googleMeetUrlPattern =
  /https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i;

function getConversationTimestamp(conversation: InboxConversation) {
  return conversation.lastMessage
    ? formatTimeOnly(conversation.lastMessage)
    : "No messages";
}

function getRoleBadgeClasses(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-700 dark:bg-red-950/35 dark:text-red-300";
    case "DOCTOR":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300";
    case "CRM":
      return "bg-green-100 text-green-700 dark:bg-green-950/35 dark:text-green-300";
    default:
      return "bg-[#EADDCD] text-[#884F38] dark:bg-[#3D3530] dark:text-[#D4B47A]";
  }
}

function getMessagesSignature(messages: ConversationMessage[]) {
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

export default function AdminMessagesPage() {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [reply, setReply] = useState("");
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) ?? null,
    [conversations, selectedConversationId],
  );

  async function loadInbox(options: { showLoading?: boolean } = {}) {
    if (options.showLoading) {
      setIsLoadingInbox(true);
    }

    try {
      const response = await fetch("/api/messages/inbox", {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | InboxResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to load inbox.");
      }

      setConversations(data?.conversations ?? []);
      setError("");
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Unable to load inbox.";
      setError(message);
    } finally {
      if (options.showLoading) {
        setIsLoadingInbox(false);
      }
    }
  }

  async function loadConversation(
    conversationId: string,
    options: { showLoading?: boolean } = {},
  ) {
    if (options.showLoading) {
      setIsLoadingMessages(true);
    }

    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | ConversationResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to load conversation.");
      }

      const nextMessages = data?.messages ?? [];
      setMessages((current) =>
        getMessagesSignature(current) === getMessagesSignature(nextMessages)
          ? current
          : nextMessages,
      );
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, isRead: true }
            : conversation,
        ),
      );
      setError("");
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load conversation.";
      setError(message);
    } finally {
      if (options.showLoading) {
        setIsLoadingMessages(false);
      }
    }
  }

  useEffect(() => {
    void loadInbox({ showLoading: true });

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadInbox();
      }
    }, INBOX_POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    void loadConversation(selectedConversationId, { showLoading: true });

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadConversation(selectedConversationId);
      }
    }, MESSAGES_POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [selectedConversationId]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: isLoadingMessages ? "auto" : "smooth",
      });
    });
  }, [messages, isLoadingMessages]);

  function handleSelectConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    setMessages([]);
    setReply("");
  }

  async function handleSendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedConversationId || isSending) {
      return;
    }

    const trimmedReply = reply.trim();

    if (!trimmedReply) {
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const response = await fetch(`/api/messages/${selectedConversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: trimmedReply,
          messageType: "TEXT",
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | SendMessageResponse
        | null;

      if (!response.ok || !data?.message) {
        throw new Error(data?.error ?? "Unable to send reply.");
      }

      setMessages((current) => [...current, data.message as ConversationMessage]);
      setReply("");
      void loadInbox();
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "Unable to send reply.";
      setError(message);
      toast.error("Unable to send reply.", {
        description: message,
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="flex h-[calc(100vh-8rem)] min-h-[620px] flex-col gap-5">
      <div>
        <h1
          className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Messages
        </h1>
        <p className="mt-2 text-sm text-[#6E6257] dark:text-[#8A7D75]">
          Reply to client conversations from one shared Selenite Care inbox.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/25 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#EADDCD] bg-white shadow-sm dark:border-[#3D3530] dark:bg-[#1A1814] lg:grid-cols-[minmax(280px,1fr)_minmax(0,2fr)]">
        <aside className="flex min-h-0 flex-col border-b border-[#EADDCD] dark:border-[#3D3530] lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-[#EADDCD] bg-[#F8F5F0] px-4 py-4 dark:border-[#3D3530] dark:bg-[#242220]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#884F38] dark:text-[#D4B47A]">
              Inbox
            </h2>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {isLoadingInbox ? (
              <p className="px-4 py-5 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                Loading conversations...
              </p>
            ) : null}

            {!isLoadingInbox && conversations.length === 0 ? (
              <p className="px-4 py-5 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                No client conversations yet.
              </p>
            ) : null}

            {conversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`flex w-full gap-3 border-b border-[#EADDCD] px-4 py-4 text-left transition-colors last:border-b-0 dark:border-[#3D3530] ${
                    isSelected
                      ? "bg-[#B87B68]/12"
                      : "hover:bg-[#B87B68]/8 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <Avatar
                    imageUrl={conversation.clientImage}
                    name={conversation.clientName}
                    size="md"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-bold text-[#2B2B2B] dark:text-[#F0EDE8]">
                        {conversation.clientName ?? "Client"}
                      </span>
                      <span className="shrink-0 text-[11px] text-[#8C7967] dark:text-[#8A7D75]">
                        {getConversationTimestamp(conversation)}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-[#884F38] dark:text-[#8A7D75]">
                      {conversation.clientPhone ?? "No phone"}
                    </span>
                    <span className="mt-2 flex items-center gap-2">
                      {!conversation.isRead ? (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#B87B68]" />
                      ) : null}
                      <span className="truncate text-xs text-[#6E6257] dark:text-[#8A7D75]">
                        {conversation.preview || "No messages yet"}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col">
          {!selectedConversation ? (
            <div className="flex flex-1 items-center justify-center bg-[#F8F5F0] px-6 text-center dark:bg-[#141210]">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#B87B68]/15 text-sm font-bold text-[#B87B68]">
                  SC
                </div>
                <h2
                  className="mt-4 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  Select a conversation to start messaging
                </h2>
              </div>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-[#EADDCD] bg-[#F8F5F0] px-5 py-4 dark:border-[#3D3530] dark:bg-[#242220]">
                <Avatar
                  imageUrl={selectedConversation.clientImage}
                  name={selectedConversation.clientName}
                  size="md"
                />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-[#2B2B2B] dark:text-[#F0EDE8]">
                    {selectedConversation.clientName ?? "Client"}
                  </h2>
                  <p className="mt-1 text-xs text-[#884F38] dark:text-[#8A7D75]">
                    {selectedConversation.clientPhone ?? "No phone number"}
                  </p>
                </div>
              </header>

              <div
                ref={messagesContainerRef}
                className="min-h-0 flex-1 overflow-y-auto bg-[#F8F5F0] px-4 py-5 dark:bg-[#141210] sm:px-6"
              >
                {isLoadingMessages ? (
                  <p className="text-sm text-[#6E6257] dark:text-[#8A7D75]">
                    Loading messages...
                  </p>
                ) : null}

                {!isLoadingMessages && messages.length === 0 ? (
                  <p className="text-sm text-[#6E6257] dark:text-[#8A7D75]">
                    No messages in this conversation yet.
                  </p>
                ) : null}

                <div className="space-y-4">
                  {messages.map((message) => {
                    const isStaffMessage = message.senderRole !== "CLIENT";

                    return (
                      <article
                        key={message.id}
                        className={`flex ${
                          isStaffMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[82%] sm:max-w-[70%] ${
                            isStaffMessage ? "text-right" : "text-left"
                          }`}
                        >
                          <div
                            className={`mb-1 flex flex-wrap items-center gap-2 ${
                              isStaffMessage ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="text-xs font-semibold text-[#884F38] dark:text-[#8A7D75]">
                              {isStaffMessage
                                ? message.senderName
                                : selectedConversation.clientName ?? "Client"}
                            </span>
                            {isStaffMessage ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getRoleBadgeClasses(
                                  message.senderRole,
                                )}`}
                              >
                                {message.senderRole}
                              </span>
                            ) : null}
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                              isStaffMessage
                                ? "rounded-br-md bg-[#2B2B2B] text-[#F8F5F0] dark:bg-[#B87B68] dark:text-[#141210]"
                                : "rounded-bl-md border border-[#EADDCD] bg-[#EFE4D8] text-[#2B2B2B] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8]"
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

              <form
                onSubmit={handleSendReply}
                className="flex items-end gap-3 border-t border-[#EADDCD] bg-white px-4 py-4 dark:border-[#3D3530] dark:bg-[#242220] sm:px-6"
              >
                <label htmlFor="admin-message-reply" className="sr-only">
                  Reply to client
                </label>
                <textarea
                  id="admin-message-reply"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Type your reply..."
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
                  disabled={isSending || !reply.trim()}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isSending || !reply.trim()
                      ? "cursor-not-allowed bg-[#EADDCD] text-[#8C7967] dark:bg-[#3D3530] dark:text-[#8A7D75]"
                      : "bg-[#2B2B2B] text-[#B87B68] hover:bg-[#3A3734] dark:bg-[#2B2B2B] dark:text-[#D4B47A] dark:hover:bg-[#3A3734]"
                  }`}
                  aria-label="Send reply"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
