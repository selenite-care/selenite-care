import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type DoctorPayload = {
  id?: unknown;
  name?: unknown;
  designation?: unknown;
  availability?: unknown;
  bio?: unknown;
  image?: unknown;
  serviceId?: unknown;
};

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

function parseDoctorPayload(body: DoctorPayload) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const designation =
    typeof body.designation === "string" ? body.designation.trim() : "";
  const availability =
    typeof body.availability === "string" ? body.availability.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const serviceId =
    typeof body.serviceId === "string" ? body.serviceId.trim() : "";

  if (!name || !designation || !availability || !serviceId) {
    return {
      error: "Name, designation, availability, and service are required.",
    };
  }

  return {
    data: {
      name,
      designation,
      availability,
      serviceId,
      bio: bio || null,
      image: image || null,
    },
  };
}

export async function GET() {
  const adminError = await requireAdmin();

  if (adminError) {
    return adminError;
  }

  const services = await db.service.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      doctors: {
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          designation: true,
          availability: true,
          bio: true,
          image: true,
          serviceId: true,
        },
      },
    },
  });

  return Response.json({ services });
}

export async function POST(request: Request) {
  const adminError = await requireAdmin();

  if (adminError) {
    return adminError;
  }

  const body = (await request.json()) as DoctorPayload;
  const parsed = parseDoctorPayload(body);

  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const doctor = await db.doctor.create({
    data: parsed.data,
  });

  return Response.json({ doctor }, { status: 201 });
}

export async function DELETE(request: Request) {
  const adminError = await requireAdmin();

  if (adminError) {
    return adminError;
  }

  const body = (await request.json()) as DoctorPayload;
  const id = typeof body.id === "string" ? body.id : "";

  if (!id) {
    return Response.json({ error: "Doctor ID is required." }, { status: 400 });
  }

  await db.doctor.delete({
    where: { id },
  });

  return Response.json({ success: true });
}
