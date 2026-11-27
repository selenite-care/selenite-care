import { db } from "@/lib/db";
import { deletePrescriptionFiles } from "@/lib/prescriptionStorage";

export async function deleteBookingWithPrescriptionFiles(bookingId: string) {
  const reports = await db.prescription.findMany({
    where: { bookingId },
    select: { pdfPath: true },
  });

  const deletedBooking = await db.booking.delete({
    where: { id: bookingId },
  });

  // The Booking -> Prescription foreign key removes database rows. Storage is
  // external to PostgreSQL, so its private objects must be removed separately.
  try {
    await deletePrescriptionFiles(reports.map((report) => report.pdfPath));
  } catch (error) {
    console.error(
      `Booking ${bookingId} was deleted, but its consultation report files could not be removed:`,
      error,
    );
  }

  return deletedBooking;
}
