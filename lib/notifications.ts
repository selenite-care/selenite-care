import { db } from "@/lib/db";

export const NOTIFICATION_TYPES = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  BOOKING: "BOOKING",
  MEMBERSHIP: "MEMBERSHIP",
  ORDER: "ORDER",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  link?: string,
) {
  return db.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link: link?.trim() || null,
    },
  });
}
