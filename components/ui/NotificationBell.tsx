"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { formatRelative } from "@/lib/dateUtils";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type:
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "BOOKING"
    | "MEMBERSHIP"
    | "ORDER"
    | "FEEDBACK"
    | string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications?: NotificationItem[];
  unreadCount?: number;
};

const typeBorderClasses: Record<string, string> = {
  INFO: "border-l-blue-500",
  SUCCESS: "border-l-green-500",
  WARNING: "border-l-amber-500",
  BOOKING: "border-l-[#B87B68]",
  MEMBERSHIP: "border-l-purple-500",
  ORDER: "border-l-orange-500",
  FEEDBACK: "border-l-[#9B59B6]",
};

function getTypeBorderClass(type: string) {
  return typeBorderClasses[type] ?? typeBorderClasses.INFO;
}

export default function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  async function loadNotifications() {
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const data = (await response.json()) as NotificationsResponse;
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    void loadNotifications();

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function markAllRead() {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
      });

      if (!response.ok) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadCount(0);
    } catch {
      // Keep the current state if the network request fails.
    }
  }

  async function handleNotificationClick(notification: NotificationItem) {
    if (!notification.isRead) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((current) => Math.max(current - 1, 0));

      try {
        await fetch(`/api/notifications/${notification.id}`, {
          method: "PATCH",
        });
      } catch {
        // Optimistic read state is acceptable; the next poll will reconcile.
      }
    }

    setIsOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EADDCD] bg-white text-[#2B2B2B] transition-colors hover:border-[#B87B68] hover:text-[#B87B68] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8]"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-3 w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-2xl border border-[#EADDCD] bg-white shadow-2xl dark:border-[#3D3530] dark:bg-[#242220]">
          <div className="flex items-center justify-between gap-3 border-b border-[#EADDCD] px-4 py-3 dark:border-[#3D3530]">
            <h2
              className="text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Notifications
            </h2>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="text-xs font-semibold text-[#B87B68] transition-colors hover:text-[#8A6A2F] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-[#D4B47A]"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#8C7967] dark:text-[#8A7D75]">
                No notifications yet
              </p>
            ) : (
              <div className="divide-y divide-[#EFE7DC] dark:divide-[#3D3530]">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`block w-full border-l-4 px-4 py-3 text-left transition-colors hover:bg-[#F8F5F0] dark:hover:bg-[#1A1814] ${getTypeBorderClass(
                      notification.type,
                    )} ${
                      notification.isRead
                        ? "bg-white dark:bg-[#242220]"
                        : "bg-[#F8F5F0] dark:bg-[#1A1814]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                        {notification.title}
                      </p>
                      {!notification.isRead ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#B87B68]" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#8C7967] dark:text-[#8A7D75]">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-[#884F38] dark:text-[#8A7D75]">
                      {formatRelative(notification.createdAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
