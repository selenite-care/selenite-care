"use client";

import { useState } from "react";
import { LoaderCircle, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type MessageClientButtonProps = {
  clientId: string;
  messagesPath: "/admin/messages" | "/crm/messages" | "/doctor/messages";
};

export default function MessageClientButton({
  clientId,
  messagesPath,
}: MessageClientButtonProps) {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);

  async function openConversation() {
    if (isOpening) return;

    setIsOpening(true);

    try {
      const response = await fetch("/api/messages/inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId }),
      });
      const data = (await response.json().catch(() => null)) as
        | { conversationId?: string; error?: string }
        | null;

      if (!response.ok || !data?.conversationId) {
        throw new Error(data?.error ?? "Unable to open conversation.");
      }

      router.push(
        `${messagesPath}?conversationId=${encodeURIComponent(data.conversationId)}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to open conversation.",
      );
      setIsOpening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={openConversation}
      disabled={isOpening}
      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-[#B87B68]/40 bg-[#B87B68]/10 px-3 text-xs font-semibold text-[#884F38] transition-colors hover:bg-[#B87B68]/20 disabled:cursor-wait disabled:opacity-60 dark:border-[#B87B68]/50 dark:text-[#D4B47A]"
    >
      {isOpening ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
      )}
      {isOpening ? "Opening..." : "Message Client"}
    </button>
  );
}
