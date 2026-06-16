import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json(
      { error: "Verification token is required." },
      { status: 400 },
    );
  }

  const user = await db.user.findUnique({
    where: { verificationToken: token },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "This verification link is invalid or has already been used." },
      { status: 404 },
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Email verified! You can now login.",
  });
}
