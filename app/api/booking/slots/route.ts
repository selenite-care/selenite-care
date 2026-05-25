import { db } from "@/lib/db";

const dayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type SlotsResponse = {
  availableSlots: string[];
  bookedSlots: string[];
};

function parseAvailability(availability: string) {
  const match = availability.match(/^([A-Za-z]{3})–([A-Za-z]{3}),\s*(\d{1,2}(?:AM|PM))–(\d{1,2}(?:AM|PM))$/);

  if (!match) {
    return null;
  }

  const [, startDay, endDay, startTime, endTime] = match;
  const startDayIndex = dayMap[startDay as keyof typeof dayMap];
  const endDayIndex = dayMap[endDay as keyof typeof dayMap];

  if (startDayIndex === undefined || endDayIndex === undefined) {
    return null;
  }

  return {
    dayRange: getDayRange(startDayIndex, endDayIndex),
    startTime: parseTime(startTime),
    endTime: parseTime(endTime),
  };
}

function getDayRange(start: number, end: number) {
  const days: number[] = [];

  let current = start;
  while (true) {
    days.push(current);
    if (current === end) break;
    current = (current + 1) % 7;
  }

  return days;
}

function parseTime(time: string) {
  const match = time.match(/^(\d{1,2})(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const period = match[2].toUpperCase();

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return hour;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function generateSlots(date: Date, startHour: number, endHour: number, slotDuration: number) {
  const slots: string[] = [];
  const start = new Date(date);
  start.setHours(startHour, 0, 0, 0);

  const end = new Date(date);
  end.setHours(endHour, 0, 0, 0);

  let current = new Date(start);
  while (current < end) {
    slots.push(formatTime(current));
    current = new Date(current.getTime() + slotDuration * 60 * 1000);
  }

  return slots;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const doctorId = url.searchParams.get("doctorId") ?? "";
  const dateParam = url.searchParams.get("date") ?? "";

  if (!doctorId || !dateParam) {
    return Response.json({ error: "doctorId and date query parameters are required." }, { status: 400 });
  }

  const date = new Date(`${dateParam}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return Response.json({ error: "Invalid date format." }, { status: 400 });
  }

  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    select: { availability: true, slotDuration: true },
  });

  if (!doctor) {
    return Response.json({ error: "Doctor not found." }, { status: 404 });
  }

  const availability = parseAvailability(doctor.availability);
  if (!availability) {
    return Response.json({ error: "Unable to parse doctor availability." }, { status: 500 });
  }

  const dayIndex = date.getDay();
  if (!availability.dayRange.includes(dayIndex)) {
    return Response.json({ availableSlots: [], bookedSlots: [] } as SlotsResponse);
  }

  if (availability.startTime === null || availability.endTime === null) {
    return Response.json({ error: "Invalid availability hours." }, { status: 500 });
  }

  const slotDuration = doctor.slotDuration ?? 15;
  const allSlots = generateSlots(date, availability.startTime, availability.endTime, slotDuration);

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

const bookings = await db.booking.findMany({
  where: {
    doctorId,
    appointmentTime: {
      gte: dayStart,
      lte: dayEnd,
    },
    status: {
      not: "CANCELLED"
    }
  },
  select: { appointmentTime: true },
});

  const bookedSlots = bookings
    .map((booking) => formatTime(new Date(booking.appointmentTime)))
    .filter((slot) => allSlots.includes(slot));

  const bookedSet = new Set(bookedSlots);
  const availableSlots = allSlots.filter((slot) => !bookedSet.has(slot));

  return Response.json({ availableSlots, bookedSlots } as SlotsResponse);
}
