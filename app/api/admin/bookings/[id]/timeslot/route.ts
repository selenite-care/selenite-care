import { auth } from "@/auth";
import {
  parseAppointmentSchedule,
  toDhakaDateInput,
} from "@/lib/appointmentSchedule";
import { db } from "@/lib/db";
import { formatLongDate } from "@/lib/dateUtils";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { formatTimeSlot, generateTimeSlots } from "@/lib/slotGenerator";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type TimeSlotPayload = {
  timeSlot?: unknown;
};

class SlotUnavailableError extends Error {}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | TimeSlotPayload
    | null;
  const timeSlot =
    typeof body?.timeSlot === "string" ? body.timeSlot.trim() : "";

  if (!timeSlot) {
    return Response.json({ error: "Time slot is required." }, { status: 400 });
  }

  const booking = await db.booking.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      appointmentTime: true,
      doctor: {
        select: {
          id: true,
          availability: true,
          slotDuration: true,
          slotBuffer: true,
        },
      },
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  if (!booking.doctor || !booking.appointmentTime) {
    return Response.json(
      { error: "This booking needs an assigned doctor and appointment date." },
      { status: 400 },
    );
  }

  const doctor = booking.doctor;

  if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
    return Response.json(
      { error: "Completed or cancelled bookings cannot be updated." },
      { status: 400 },
    );
  }

  const appointmentDate = toDhakaDateInput(booking.appointmentTime);
  const schedule = parseAppointmentSchedule(appointmentDate, timeSlot);

  if (!schedule) {
    return Response.json(
      { error: "Time slot must use HH:mm format." },
      { status: 400 },
    );
  }

  const existingSlotBooking = await db.booking.findFirst({
    where: {
      id: {
        not: booking.id,
      },
      doctorId: doctor.id,
      timeSlot: schedule.timeSlot,
      appointmentTime: {
        gte: schedule.startOfDay,
        lt: schedule.endOfDay,
      },
      status: {
        notIn: ["CANCELLED"],
      },
    },
    select: {
      id: true,
    },
  });

  if (existingSlotBooking) {
    return Response.json(
      {
        error:
          "This time slot is no longer available. Please select another slot.",
      },
      { status: 409 },
    );
  }

  try {
    const updatedBooking = await db.$transaction(async (transaction) => {
      const conflictingBooking = await transaction.booking.findFirst({
        where: {
          id: {
            not: booking.id,
          },
          doctorId: doctor.id,
          timeSlot: schedule.timeSlot,
          appointmentTime: {
            gte: schedule.startOfDay,
            lt: schedule.endOfDay,
          },
          status: {
            notIn: ["CANCELLED"],
          },
        },
        select: {
          id: true,
        },
      });

      if (conflictingBooking) {
        throw new SlotUnavailableError();
      }

      const existingBookings = await transaction.booking.findMany({
        where: {
          id: {
            not: booking.id,
          },
          doctorId: doctor.id,
          timeSlot: {
            not: null,
          },
          appointmentTime: {
            gte: schedule.startOfDay,
            lt: schedule.endOfDay,
          },
          status: {
            notIn: ["CANCELLED"],
          },
        },
        select: {
          timeSlot: true,
          slotDuration: true,
        },
      });
      const requestedSlot = generateTimeSlots(
        doctor.availability,
        schedule.requestedDate,
        existingBookings,
        doctor.slotDuration,
        doctor.slotBuffer,
      ).find((slot) => slot.time === schedule.timeSlot);

      if (!requestedSlot?.available) {
        throw new SlotUnavailableError();
      }

      return transaction.booking.update({
        where: { id: booking.id },
        data: {
          timeSlot: schedule.timeSlot,
          slotDuration: doctor.slotDuration,
          appointmentTime: schedule.appointmentTime,
        },
        select: {
          id: true,
          token: true,
          userId: true,
          doctorId: true,
          status: true,
          appointmentTime: true,
          timeSlot: true,
          slotDuration: true,
        },
      });
    }, { isolationLevel: "Serializable" });

    try {
      await createNotification(
        updatedBooking.userId,
        "Consultation Time Updated",
        `Your consultation time has been updated to ${formatTimeSlot(schedule.timeSlot)} on ${formatLongDate(schedule.appointmentTime)}. Please check your booking details.`,
        NOTIFICATION_TYPES.BOOKING,
        `/dashboard/bookings/${updatedBooking.id}`,
      );
    } catch (notificationError) {
      console.error(
        "Failed to send consultation time notification:",
        notificationError,
      );
    }

    return Response.json({ booking: updatedBooking });
  } catch (error) {
    if (
      error instanceof SlotUnavailableError ||
      (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2034")
    ) {
      return Response.json(
        {
          error:
            "This time slot is no longer available. Please select another slot.",
        },
        { status: 409 },
      );
    }

    console.error("Failed to update consultation time slot:", error);
    return Response.json(
      { error: "Unable to update the consultation time." },
      { status: 500 },
    );
  }
}
