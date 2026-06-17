import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    doctorId: string;
  }>;
};

type StatusPayload = {
  isActive?: unknown;
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

export async function PATCH(request: Request, context: RouteContext) {
  const adminError = await requireAdmin();

  if (adminError) {
    return adminError;
  }

  const { doctorId } = await context.params;
  const body = (await request.json()) as StatusPayload;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : null;

  if (!doctorId || isActive === null) {
    return Response.json(
      { error: "Doctor ID and isActive are required." },
      { status: 400 },
    );
  }

  const existingDoctor = await db.doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!existingDoctor) {
    return Response.json({ error: "Doctor not found." }, { status: 404 });
  }

  const doctor = await db.$transaction(async (tx) => {
    if (existingDoctor.userId) {
      await tx.user.update({
        where: { id: existingDoctor.userId },
        data: { isActive },
      });
    }

    return tx.doctor.update({
      where: { id: doctorId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        designation: true,
        availability: true,
        bio: true,
        image: true,
        isActive: true,
      },
    });
  });

  return Response.json({ doctor });
}
