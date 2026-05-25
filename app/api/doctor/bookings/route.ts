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

  const doctor = await db.doctor.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!doctor) {
    return new Response(
      JSON.stringify({ bookings: [] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const bookings = await db.booking.findMany({
    where: { doctorId: doctor.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          price: true,
        },
      },
      payment: {
        select: {
          id: true,
          stripePaymentId: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
      surveyResponse: {
        select: {
          id: true,
          name: true,
          age: true,
          phone: true,
          email: true,
          skinType: true,
          codeId: true,
          usesKoreanProducts: true,
          facingSkinIssues: true,
          skinIssues: true,
          skinIssueDuration: true,
          currentProducts: true,
          allergicIngredients: true,
          doubleCleansePreference: true,
          sleepHours: true,
          waterIntake: true,
          appliesSunscreen: true,
          regularPeriodCycle: true,
          usedIndoPakNightCream: true,
          note: true,
        },
      },
    },
    orderBy: { appointmentTime: "desc" },
  });

  return new Response(
    JSON.stringify({ bookings }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
