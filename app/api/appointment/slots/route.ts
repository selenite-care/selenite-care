import { db } from "@/lib/db";
import { generateTimeSlots } from "@/lib/slotGenerator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

function parseRequestedDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const validationDate = new Date(Date.UTC(year, month - 1, day));

  if (
    validationDate.getUTCFullYear() !== year ||
    validationDate.getUTCMonth() !== month - 1 ||
    validationDate.getUTCDate() !== day
  ) {
    return null;
  }

  const dateKey = `${match[1]}-${match[2]}-${match[3]}`;
  const start = new Date(`${dateKey}T00:00:00+06:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const requestedDate = new Date(year, month - 1, day);

  return { requestedDate, start, end };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId")?.trim() ?? "";
  const dateValue = searchParams.get("date")?.trim() ?? "";

  if (!doctorId || !dateValue) {
    return Response.json(
      { error: "doctorId and date are required." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsedDate = parseRequestedDate(dateValue);
  if (!parsedDate) {
    return Response.json(
      { error: "date must be a valid ISO date string." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const doctor = await db.doctor.findFirst({
      where: {
        id: doctorId,
        isActive: true,
      },
      select: {
        name: true,
        availability: true,
        slotDuration: true,
        slotBuffer: true,
      },
    });

    if (!doctor) {
      return Response.json(
        { error: "Doctor not found or inactive." },
        { status: 404, headers: NO_STORE_HEADERS },
      );
    }

    const existingBookings = await db.booking.findMany({
      where: {
        doctorId,
        status: {
          not: "CANCELLED",
        },
        timeSlot: {
          not: null,
        },
        appointmentTime: {
          gte: parsedDate.start,
          lt: parsedDate.end,
        },
      },
      select: {
        timeSlot: true,
        slotDuration: true,
      },
    });

    const slots = generateTimeSlots(
      doctor.availability,
      parsedDate.requestedDate,
      existingBookings,
      doctor.slotDuration,
      doctor.slotBuffer,
    );

    return Response.json(
      {
        slots,
        slotDuration: doctor.slotDuration,
        doctorName: doctor.name,
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("Failed to load appointment slots:", error);
    return Response.json(
      { error: "Unable to load appointment slots." },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
