import {
  normalizeAvailabilityText,
  parseAvailableDays,
} from "@/lib/doctorAvailability";

export type GeneratedTimeSlot = {
  time: string;
  label: string;
  available: boolean;
};

type ExistingBooking = {
  timeSlot: string | null;
  slotDuration: number;
};

type ParsedTime = {
  hours: number;
  minutes: number;
};

const TIME_RANGE_PATTERN =
  /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i;

function parseTwelveHourTime(
  hourValue: string,
  minuteValue: string | undefined,
  meridiemValue: string,
): ParsedTime | null {
  const hour = Number.parseInt(hourValue, 10);
  const minutes = Number.parseInt(minuteValue ?? "0", 10);

  if (hour < 1 || hour > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  let hours = hour % 12;
  if (meridiemValue.toUpperCase() === "PM") hours += 12;

  return { hours, minutes };
}

function parseAvailabilityTimeRange(availability: string) {
  const normalizedAvailability = normalizeAvailabilityText(availability);
  const match = normalizedAvailability.match(TIME_RANGE_PATTERN);

  if (!match) return null;

  const start = parseTwelveHourTime(match[1], match[2], match[3]);
  const end = parseTwelveHourTime(match[4], match[5], match[6]);

  if (!start || !end) return null;

  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  if (endMinutes <= startMinutes) return null;

  return { startMinutes, endMinutes };
}

function toTimeValue(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function isSameCalendarDate(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function formatTimeSlot(time: string): string {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return time;

  const displayHour = hours % 12 || 12;
  const meridiem = hours < 12 ? "AM" : "PM";

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

export function generateTimeSlots(
  availability: string,
  date: Date,
  existingBookings: ExistingBooking[],
  slotDuration: number = 20,
  bufferMinutes: number = 5,
): GeneratedTimeSlot[] {
  if (
    !availability.trim() ||
    Number.isNaN(date.getTime()) ||
    !Number.isFinite(slotDuration) ||
    !Number.isFinite(bufferMinutes) ||
    slotDuration <= 0 ||
    bufferMinutes < 0
  ) {
    return [];
  }

  const availableDays = parseAvailableDays(availability);
  if (!availableDays.has(date.getDay())) return [];

  const timeRange = parseAvailabilityTimeRange(availability);
  if (!timeRange) return [];

  const bookedTimes = new Set(
    existingBookings.flatMap((booking) =>
      booking.timeSlot ? [booking.timeSlot.trim()] : [],
    ),
  );
  const intervalMinutes = slotDuration + bufferMinutes;
  const now = new Date();
  const sameDayCutoff = new Date(now.getTime() + 30 * 60 * 1000);
  const isToday = isSameCalendarDate(date, now);
  const slots: GeneratedTimeSlot[] = [];

  for (
    let slotStart = timeRange.startMinutes;
    slotStart + slotDuration <= timeRange.endMinutes;
    slotStart += intervalMinutes
  ) {
    const time = toTimeValue(slotStart);
    let available = !bookedTimes.has(time);

    if (available && isToday) {
      const slotDate = new Date(date);
      slotDate.setHours(Math.floor(slotStart / 60), slotStart % 60, 0, 0);
      available = slotDate.getTime() >= sameDayCutoff.getTime();
    }

    slots.push({
      time,
      label: formatTimeSlot(time),
      available,
    });
  }

  return slots;
}
