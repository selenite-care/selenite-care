import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    doctorId: string;
  }>;
};

type DoctorUpdatePayload = {
  name?: unknown;
  designation?: unknown;
  bio?: unknown;
  availability?: unknown;
  image?: unknown;
  specialization?: unknown;
};

const doctorSpecializations = new Set([
  "AESTHETICIAN",
  "NUTRITIONIST",
  "PSYCHIATRIST",
] as const);

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const adminError = await requireAdmin();

  if (adminError) {
    return adminError;
  }

  const { doctorId } = await context.params;

  if (!doctorId) {
    return Response.json({ error: "Doctor ID is required." }, { status: 400 });
  }

  const body = (await request.json()) as DoctorUpdatePayload;
  const data: {
    name?: string;
    designation?: string;
    bio?: string | null;
    availability?: string;
    image?: string | null;
    specialization?: "AESTHETICIAN" | "NUTRITIONIST" | "PSYCHIATRIST";
  } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return Response.json({ error: "Name must be a non-empty string." }, { status: 400 });
    }

    data.name = body.name.trim();
  }

  if (body.designation !== undefined) {
    if (typeof body.designation !== "string" || !body.designation.trim()) {
      return Response.json(
        { error: "Designation must be a non-empty string." },
        { status: 400 },
      );
    }

    data.designation = body.designation.trim();
  }

  if (body.bio !== undefined) {
    if (typeof body.bio !== "string") {
      return Response.json({ error: "Bio must be a string." }, { status: 400 });
    }

    const bio = body.bio.trim();
    data.bio = bio || null;
  }

  if (body.availability !== undefined) {
    if (typeof body.availability !== "string" || !body.availability.trim()) {
      return Response.json(
        { error: "Availability must be a non-empty string." },
        { status: 400 },
      );
    }

    data.availability = body.availability.trim();
  }

  if (body.image !== undefined) {
    if (typeof body.image !== "string") {
      return Response.json({ error: "Image must be a string." }, { status: 400 });
    }

    const image = body.image.trim();
    data.image = image || null;
  }

  if (body.specialization !== undefined) {
    if (
      typeof body.specialization !== "string" ||
      !doctorSpecializations.has(body.specialization.trim() as never)
    ) {
      return Response.json(
        { error: "A valid specialization is required." },
        { status: 400 },
      );
    }

    data.specialization = body.specialization.trim() as
      | "AESTHETICIAN"
      | "NUTRITIONIST"
      | "PSYCHIATRIST";
  }

  if (Object.keys(data).length === 0) {
    return Response.json(
      { error: "At least one field must be provided to update." },
      { status: 400 },
    );
  }

  const existingDoctor = await db.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true },
  });

  if (!existingDoctor) {
    return Response.json({ error: "Doctor not found." }, { status: 404 });
  }

  const doctor = await db.doctor.update({
    where: { id: doctorId },
    data,
    select: {
      id: true,
      name: true,
      designation: true,
      bio: true,
      availability: true,
      image: true,
      slotDuration: true,
      specialization: true,
      isActive: true,
      userId: true,
    },
  });

  return Response.json({ doctor });
}
