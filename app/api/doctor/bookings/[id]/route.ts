import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

async function findDoctorForSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") return null;
  const userName = session.user.name?.trim() ?? "";
  if (!userName) return null;

  let doctor = await db.doctor.findFirst({ where: { name: userName }, select: { id: true } });
  if (!doctor && !userName.toLowerCase().startsWith("dr.")) {
    doctor = await db.doctor.findFirst({ where: { name: `Dr. ${userName}` }, select: { id: true } });
  }

  return doctor;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const doctor = await findDoctorForSession();
  if (!doctor) {
    return new Response(JSON.stringify({ error: "Unauthorized or doctor not found" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const { id } = params;
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      service: { select: { id: true, name: true, description: true, duration: true, price: true } },
      doctor: { select: { id: true, name: true, designation: true, availability: true, bio: true } },
      payment: { select: { id: true, stripePaymentId: true, amount: true, status: true, createdAt: true } },
      surveyResponse: true,
    },
  });

  if (!booking || booking.doctorId !== doctor.id) {
    return new Response(JSON.stringify({ error: "Booking not found or not assigned to you" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ booking }), { status: 200, headers: { "Content-Type": "application/json" } });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const doctor = await findDoctorForSession();
  if (!doctor) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const { id } = params;
  const body = await request.json().catch(() => ({}));
  const newStatus = body?.status as string | undefined;
  if (!newStatus) {
    return new Response(JSON.stringify({ error: "Missing status" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Only allow PENDING or COMPLETED to be set by doctors
  const allowed = new Set(["PENDING", "COMPLETED"]);
  if (!allowed.has(newStatus)) {
    return new Response(JSON.stringify({ error: "Invalid status" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const existing = await db.booking.findUnique({ where: { id }, select: { id: true, doctorId: true } });
  if (!existing || existing.doctorId !== doctor.id) {
    return new Response(JSON.stringify({ error: "Booking not found or not assigned to you" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const booking = await db.booking.update({ where: { id }, data: { status: newStatus as any } });

  return new Response(JSON.stringify({ booking }), { status: 200, headers: { "Content-Type": "application/json" } });
}
