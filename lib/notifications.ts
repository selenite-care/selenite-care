import { db } from "@/lib/db";

export const NOTIFICATION_TYPES = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  BOOKING: "BOOKING",
  MEMBERSHIP: "MEMBERSHIP",
  ORDER: "ORDER",
  FEEDBACK: "FEEDBACK",
} as const;

export type NotificationType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "BOOKING"
  | "MEMBERSHIP"
  | "ORDER"
  | "FEEDBACK";

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

type BookingChangeType = "APPOINTMENT_DATE" | "BOOKING_STATUS";

type BookingNotificationRecipientRole = "CLIENT" | "ADMIN" | "DOCTOR" | "CRM";

type NotifyBookingChangeInput = {
  bookingId: string;
  triggeredByRole: string;
  triggeredByUserId: string;
  changeType: BookingChangeType;
  changeDetail: string;
  newValue: string;
};

function formatRoleLabel(role: string) {
  const normalizedRole = role.trim().toUpperCase();

  if (normalizedRole === "CRM") {
    return "CRM";
  }

  return normalizedRole.charAt(0) + normalizedRole.slice(1).toLowerCase();
}

function getBookingNotificationLink(
  recipientRole: BookingNotificationRecipientRole,
  bookingId: string,
) {
  switch (recipientRole) {
    case "ADMIN":
      return `/admin/bookings/${bookingId}`;
    case "DOCTOR":
      return `/doctor/bookings/${bookingId}`;
    case "CRM":
      return `/crm/bookings/${bookingId}`;
    case "CLIENT":
    default:
      return `/dashboard/bookings/${bookingId}`;
  }
}

export async function notifyBookingChange(input: NotifyBookingChangeInput) {
  const booking = await db.booking.findUnique({
    where: {
      id: input.bookingId,
    },
    select: {
      id: true,
      token: true,
      userId: true,
      doctorId: true,
      doctor: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!booking) {
    return {
      notifiedCount: 0,
    };
  }

  const [adminUsers, crmUsers] = await Promise.all([
    db.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
      },
    }),
    db.user.findMany({
      where: {
        role: "CRM",
      },
      select: {
        id: true,
      },
    }),
  ]);

  const recipients = new Map<string, BookingNotificationRecipientRole>();
  const triggeredByRole = input.triggeredByRole.trim().toUpperCase();
  const doctorUserId = booking.doctor?.userId;

  function addRecipient(
    userId: string | null | undefined,
    role: BookingNotificationRecipientRole,
  ) {
    if (!userId || userId === input.triggeredByUserId) {
      return;
    }

    recipients.set(userId, role);
  }

  function addAdmins() {
    for (const admin of adminUsers) {
      addRecipient(admin.id, "ADMIN");
    }
  }

  function addCrms() {
    for (const crm of crmUsers) {
      addRecipient(crm.id, "CRM");
    }
  }

  if (triggeredByRole === "ADMIN") {
    addRecipient(doctorUserId, "DOCTOR");
    addCrms();
    addRecipient(booking.userId, "CLIENT");
  } else if (triggeredByRole === "DOCTOR") {
    addAdmins();
    addCrms();
    addRecipient(booking.userId, "CLIENT");
  } else if (triggeredByRole === "CRM") {
    addAdmins();
    addRecipient(doctorUserId, "DOCTOR");
    addRecipient(booking.userId, "CLIENT");
  }

  const roleLabel = formatRoleLabel(input.triggeredByRole);
  const title =
    input.changeType === "APPOINTMENT_DATE"
      ? "Appointment Date Updated"
      : "Booking Status Updated";
  const message =
    input.changeType === "APPOINTMENT_DATE"
      ? `${roleLabel} updated the appointment date for booking #${booking.token} to ${input.newValue}`
      : `${roleLabel} updated booking #${booking.token} status to ${input.newValue}`;

  await Promise.all(
    Array.from(recipients.entries()).map(([userId, role]) =>
      createNotification(
        userId,
        title,
        message,
        NOTIFICATION_TYPES.BOOKING,
        getBookingNotificationLink(role, booking.id),
      ),
    ),
  );

  return {
    notifiedCount: recipients.size,
  };
}
