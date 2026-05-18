import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

type RegisterPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterPayload;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || !email || !phone || !password) {
    return Response.json(
      { error: "Name, email, phone, and password are required." },
      { status: 400 },
    );
  }

  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return Response.json(
      { error: "A user with this email already exists." },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: "CLIENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  return Response.json({ user }, { status: 201 });
}