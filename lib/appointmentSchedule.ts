import { formatTimeSlot } from "@/lib/slotGenerator";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export type AppointmentSchedule = {
  date: string;
  timeSlot: string;
  appointmentTime: Date;
  requestedDate: Date;
  startOfDay: Date;
  endOfDay: Date;
};

export function parseAppointmentSchedule(
  dateValue: unknown,
  timeSlotValue: unknown,
): AppointmentSchedule | null {
  if (typeof dateValue !== "string" || typeof timeSlotValue !== "string") {
    return null;
  }

  const date = dateValue.trim();
  const timeSlot = timeSlotValue.trim();
  const dateMatch = date.match(DATE_PATTERN);

  if (!dateMatch || !TIME_PATTERN.test(timeSlot)) return null;

  const year = Number.parseInt(dateMatch[1], 10);
  const month = Number.parseInt(dateMatch[2], 10);
  const day = Number.parseInt(dateMatch[3], 10);
  const validationDate = new Date(Date.UTC(year, month - 1, day));

  if (
    validationDate.getUTCFullYear() !== year ||
    validationDate.getUTCMonth() !== month - 1 ||
    validationDate.getUTCDate() !== day
  ) {
    return null;
  }

  const appointmentTime = new Date(`${date}T${timeSlot}:00+06:00`);
  const startOfDay = new Date(`${date}T00:00:00+06:00`);

  if (
    Number.isNaN(appointmentTime.getTime()) ||
    Number.isNaN(startOfDay.getTime())
  ) {
    return null;
  }

  return {
    date,
    timeSlot,
    appointmentTime,
    requestedDate: new Date(year, month - 1, day),
    startOfDay,
    endOfDay: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
  };
}

export function formatAppointmentSchedule(
  appointmentTime: Date,
  timeSlot: string,
) {
  const dateLabel = new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(appointmentTime);

  return `${dateLabel} at ${formatTimeSlot(timeSlot)}`;
}

export function toDhakaDateInput(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Dhaka",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : "";
}
