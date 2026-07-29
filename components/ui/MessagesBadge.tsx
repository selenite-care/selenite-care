"use client";

import { useEffect, useState } from "react";

type UnreadMessagesResponse = {
  count?: number;
};

const POLL_INTERVAL_MS = 60_000;

export default function MessagesBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/messages/unread", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (isMounted) {
            setCount(0);
          }
          return;
        }

        const data = (await response.json().catch(() => null)) as
          | UnreadMessagesResponse
          | null;

        if (isMounted) {
          setCount(data?.count ?? 0);
        }
      } catch {
        if (isMounted) {
          setCount(0);
        }
      }
    }

    void loadUnreadCount();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadUnreadCount();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  if (count <= 0) {
    return null;
  }

  return (
    <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
