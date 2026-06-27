import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ReschedulePayload = {
  appointmentDate?: unknown;
  appointmentTime?: unknown;
};

const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function normalizeAvailabilityText(availability: string) {
  return availability
    .replace(/[\u2013\u2014]/g, "-")
    .trim();
}

function parseAvailableDays(availability: string) {
  const allowed = new Set<number>();
  const normalizedAvailability = normalizeAvailabilityText(availability);
  const segments = normalizedAvailability
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const timeSegmentIndex = [...segments]
    .reverse()
    .findIndex((segment) => /(?:AM|PM)/i.test(segment) && segment.includes("-"));

  const daySegments =
    timeSegmentIndex === -1
      ? segments
      : segments.slice(0, segments.length - timeSegmentIndex - 1);

  for (const segment of daySegments) {
    const compactSegment = segment.replace(/\s+/g, "");

    if (!compactSegment) {
      continue;
    }

    if (compactSegment.includes("-")) {
      const [startDay, endDay] = compactSegment.split("-");
      const startIndex = dayOrder.indexOf(startDay);
      const endIndex = dayOrder.indexOf(endDay ?? startDay);

      if (startIndex === -1) {
        continue;
      }

      if (endIndex === -1 || startIndex === endIndex) {
        allowed.add(startIndex);
        continue;
      }

      if (startIndex < endIndex) {
        for (let index = startIndex; index <= endIndex; index += 1) {
          allowed.add(index);
        }
      } else {
        for (let index = startIndex; index < dayOrder.length; index += 1) {
          allowed.add(index);
        }

        for (let index = 0; index <= endIndex; index += 1) {
          allowed.add(index);
        }
      }

      continue;
    }

    const dayIndex = dayOrder.indexOf(compactSegment);

    if (dayIndex !== -1) {
      allowed.add(dayIndex);
    }
  }

  return allowed;
}

function parseAvailabilityEndTime(availability: string) {
  const normalizedAvailability = normalizeAvailabilityText(availability);
  const segments = normalizedAvailability
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const timeSegment = [...segments]
    .reverse()
    .find((segment) => /(?:AM|PM)/i.test(segment) && segment.includes("-"));

  if (!timeSegment) {
    return null;
  }

  const [, endTimeRaw] = timeSegment.split("-");
  const endTimeLabel = endTimeRaw?.trim();

  if (!endTimeLabel) {
    return null;
  }

  const match = endTimeLabel.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const meridiem = match[3].toUpperCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  let hours24 = hours % 12;

  if (meridiem === "PM") {
    hours24 += 12;
  }

  return {
    hours24,
    minutes,
  };
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json({ error: "Booking ID is required." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as ReschedulePayload;
  const appointmentDateInput =
    typeof body.appointmentDate === "string"
      ? body.appointmentDate.trim()
      : typeof body.appointmentTime === "string"
        ? body.appointmentTime.trim()
        : "";
  const nextAppointmentTime = parseLocalDate(appointmentDateInput);

  if (!nextAppointmentTime) {
    return Response.json(
      { error: "Please provide a valid appointment date." },
      { status: 400 },
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (nextAppointmentTime.getTime() < today.getTime()) {
    return Response.json(
      { error: "Appointment date cannot be in the past." },
      { status: 400 },
    );
  }

  const booking = await db.booking.findUnique({
    where: { id },
    select: {
      id: true,
      token: true,
      status: true,
      doctor: {
        select: {
          id: true,
          name: true,
          availability: true,
        },
      },
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  if (!booking.doctor) {
    return Response.json(
      { error: "This booking does not have an assigned doctor." },
      { status: 400 },
    );
  }

  if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
    return Response.json(
      { error: "Completed or cancelled bookings cannot be rescheduled." },
      { status: 400 },
    );
  }

  const availableDays = parseAvailableDays(booking.doctor.availability);

  if (availableDays.size > 0 && !availableDays.has(nextAppointmentTime.getDay())) {
    return Response.json(
      {
        error: `${booking.doctor.name} is not available on ${formatDateLabel(
          nextAppointmentTime,
        )}.`,
      },
      { status: 400 },
    );
  }

  if (toDateInputValue(nextAppointmentTime) === toDateInputValue(new Date())) {
    const endTime = parseAvailabilityEndTime(booking.doctor.availability);

    if (endTime) {
      const now = new Date();
      const cutoffMinutes = endTime.hours24 * 60 + endTime.minutes - 120;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      if (currentMinutes >= cutoffMinutes) {
        return Response.json(
          {
            error:
              "Booking cutoff has passed for today. Please select a future date.",
          },
          { status: 400 },
        );
      }
    }
  }

  const updatedBooking = await db.booking.update({
    where: { id },
    data: {
      appointmentTime: nextAppointmentTime,
    },
    select: {
      id: true,
      token: true,
      appointmentTime: true,
    },
  });

  return Response.json({ booking: updatedBooking });
}

