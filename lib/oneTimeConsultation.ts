import type { Prisma } from "@prisma/client";

export const ONE_TIME_CONSULTATION_HOLD_MINUTES = 15;

export function getOneTimeConsultationHoldCutoff(now = new Date()) {
  return new Date(
    now.getTime() - ONE_TIME_CONSULTATION_HOLD_MINUTES * 60 * 1000,
  );
}

export function getSlotBlockingBookingWhere(
  now = new Date(),
): Prisma.BookingWhereInput {
  return {
    OR: [
      { isOneTimeConsultation: false },
      {
        isOneTimeConsultation: true,
        oneTimeConsultation: {
          is: {
            OR: [
              { paymentStatus: "PAID" },
              {
                paymentStatus: "UNPAID",
                createdAt: {
                  gte: getOneTimeConsultationHoldCutoff(now),
                },
              },
            ],
          },
        },
      },
    ],
  };
}

export function getClientVisibleBookingWhere(): Prisma.BookingWhereInput {
  return {
    OR: [
      { isOneTimeConsultation: false },
      {
        isOneTimeConsultation: true,
        oneTimeConsultation: {
          is: {
            paymentStatus: "PAID",
            paymentConflict: false,
          },
        },
      },
    ],
  };
}

export function getStaffVisibleBookingWhere(): Prisma.BookingWhereInput {
  return {
    OR: [
      { isOneTimeConsultation: false },
      {
        isOneTimeConsultation: true,
        oneTimeConsultation: {
          is: {
            paymentStatus: "PAID",
          },
        },
      },
    ],
  };
}
