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
        totalAssignedBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const totalAssignedBookings = await db.booking.count({
    where: { doctorId: doctor.id },
  });

  const pendingBookings = await db.booking.count({
    where: {
      doctorId: doctor.id,
      status: {
        notIn: ["COMPLETED", "CANCELLED"],
      },
    },
  });

  const completedBookings = await db.booking.count({
    where: { doctorId: doctor.id, status: "COMPLETED" },
  });

  return new Response(
    JSON.stringify({
      doctorName: doctor.name,
      totalAssignedBookings,
      pendingBookings,
      completedBookings,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
