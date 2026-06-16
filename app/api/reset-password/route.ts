import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

type ResetPasswordPayload = {
  token?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ResetPasswordPayload;
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token || !password) {
    return Response.json(
      { error: "Token and password are required." },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return Response.json(
      { error: "Password must be at least 6 characters long." },
      { status: 400 },
    );
  }

  const user = await db.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return Response.json(
      { error: "This password reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      isTemporaryPassword: false,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return Response.json({
    success: true,
    message: "Your password has been reset successfully. You can now log in.",
  });
}
