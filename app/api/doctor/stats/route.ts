import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "DOCTOR") {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const userName = session.user.name?.trim() ?? "";

  let doctor = null;
  if (userName) {
    doctor = await db.doctor.findFirst({
      where: { name: userName },
      select: { id: true, name: true },
    });

    if (!doctor && !userName.toLowerCase().startsWith("dr.")) {
      doctor = await db.doctor.findFirst({
        where: { name: `Dr. ${userName}` },
        select: { id: true, name: true },
      });
    }
  }

  if (!doctor) {
    return new Response(
      JSON.stringify({
        doctorName: userName || "Doctor",
        membershipBookings: 0,
        directConsultations: 0,
        pendingBookings: 0,
        completedBookings: 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const [
    membershipBookings,
    directConsultations,
    pendingBookings,
    completedBookings,
  ] = await db.$transaction([
    db.booking.count({
      where: {
        doctorId: doctor.id,
        isOneTimeConsultation: false,
      },
    }),
    db.oneTimeConsultation.count({
      where: {
        paymentStatus: "PAID",
        booking: {
          is: {
            doctorId: doctor.id,
          },
        },
      },
    }),
    db.booking.count({
      where: {
        doctorId: doctor.id,
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
    }),
    db.booking.count({
      where: { doctorId: doctor.id, status: "COMPLETED" },
    }),
  ]);

  return new Response(
    JSON.stringify({
      doctorName: doctor.name,
      membershipBookings,
      directConsultations,
      pendingBookings,
      completedBookings,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
