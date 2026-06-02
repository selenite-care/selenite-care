import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

const { auth } = NextAuth(authConfig);

type UpdateUserPayload = {
  role?: unknown;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json(
      { error: "User ID is required." },
      { status: 400 },
    );
  }

  const body = (await request.json()) as UpdateUserPayload;
  const role = typeof body.role === "string" ? body.role : "";

  const validRoles = ["CLIENT", "DOCTOR", "CRM", "ADMIN"];
  if (!validRoles.includes(role)) {
    return Response.json(
      { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const user = await db.user.update({
      where: { id },
      data: {
        role: role as Role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    return Response.json({ user });
  } catch {
    return Response.json(
      { error: "Failed to update user role." },
      { status: 500 },
    );
  }
}
