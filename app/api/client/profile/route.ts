import NextAuth from "next-auth";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type ProfilePayload = {
  name?: unknown;
  action?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
};

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  });

  if (!user) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  return Response.json({ user });
}

export async function PUT(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await req.json()) as ProfilePayload;

  // Update name
  if (body.name && typeof body.name === "string") {
    const name = body.name.trim();

    if (!name) {
      return Response.json({ error: "Name cannot be empty." }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return Response.json({ user });
  }

  // Change password
  if (body.action === "changePassword") {
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return Response.json({ error: "Both current and new passwords are required." }, { status: 400 });
    }

    const userWithPassword = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!userWithPassword || !userWithPassword.password) {
      return Response.json({ error: "User password not set." }, { status: 400 });
    }

    const isValid = await bcrypt.compare(currentPassword, userWithPassword.password);

    if (!isValid) {
      return Response.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.user.update({ where: { id: session.user.id }, data: { password: hashed } });

    return Response.json({ ok: true });
  }

  return Response.json({ error: "Invalid request." }, { status: 400 });
}
