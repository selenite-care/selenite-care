import { db } from "@/lib/db";

type SubmitBookingFormPayload = {
  bookingId?: unknown;
  skinType?: unknown;
  mainSkinConcerns?: unknown;
  currentSkincareRoutine?: unknown;
  allergies?: unknown;
  additionalNotes?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SubmitBookingFormPayload;
  const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
  const skinType = typeof body.skinType === "string" ? body.skinType : "";
  const mainSkinConcerns =
    typeof body.mainSkinConcerns === "string" ? body.mainSkinConcerns : "";
  const currentSkincareRoutine =
    typeof body.currentSkincareRoutine === "string"
      ? body.currentSkincareRoutine
      : "";

  if (!bookingId || !skinType || !mainSkinConcerns || !currentSkincareRoutine) {
    return Response.json(
      {
        error:
          "Booking ID, skin type, main skin concerns, and current skincare routine are required.",
      },
      { status: 400 },
    );
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { id: true },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  const updatedBooking = await db.booking.update({
    where: { id: bookingId },
    data: {
      status: "CONFIRMED",
    },
    select: {
      id: true,
      status: true,
    },
  });

  return Response.json({
    bookingId: updatedBooking.id,
    status: updatedBooking.status,
  });
}
