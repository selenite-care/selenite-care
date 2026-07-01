import NextAuth from "next-auth";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSheetPhoneByEmail } from "@/lib/googleSheets";
import { sanitizePhone } from "@/lib/sanitize";

const { auth } = NextAuth(authConfig);

type ProfilePayload = {
  name?: unknown;
  phone?: unknown;
  image?: unknown;
  dateOfBirth?: unknown;
  gender?: unknown;
  action?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
};

const allowedGenders = new Set(["Male", "Female", "Other", "Prefer not to say"]);

const profileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  image: true,
  dateOfBirth: true,
  gender: true,
  createdAt: true,
};

function buildProfileUpdateData(body: ProfilePayload) {
  const data: {
    name?: string;
    phone?: string;
    dateOfBirth?: Date | null;
    gender?: string | null;
    image?: string | null;
  } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();

    if (!name) {
      return { error: "Name cannot be empty." };
    }

    data.name = name;
  }

  if (typeof body.phone === "string") {
    const phone = sanitizePhone(body.phone);

    if (!phone) {
      return { error: "Phone number is required." };
    }

    data.phone = phone;
  }

  if (typeof body.image === "string") {
    data.image = body.image.trim() || null;
  }

  if (typeof body.dateOfBirth === "string") {
    if (body.dateOfBirth) {
      const dateOfBirth = new Date(body.dateOfBirth);

      if (Number.isNaN(dateOfBirth.getTime())) {
        return { error: "Invalid date of birth." };
      }

      data.dateOfBirth = dateOfBirth;
    } else {
      data.dateOfBirth = null;
    }
  }

  if (typeof body.gender === "string") {
    const gender = body.gender.trim();

    if (gender && !allowedGenders.has(gender)) {
      return { error: "Invalid gender value." };
    }

    data.gender = gender || null;
  }

  return { data };
}

async function updateProfile(sessionUserId: string, body: ProfilePayload) {
  const profileUpdate = buildProfileUpdateData(body);

  if (profileUpdate.error) {
    return Response.json({ error: profileUpdate.error }, { status: 400 });
  }

  if (!profileUpdate.data || Object.keys(profileUpdate.data).length === 0) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: sessionUserId },
    data: profileUpdate.data,
    select: profileSelect,
  });

  if (profileUpdate.data.phone && user.email) {
    await updateSheetPhoneByEmail(user.email, profileUpdate.data.phone);
  }

  return Response.json({ user });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: profileSelect,
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

    await db.user.update({
      where: { id: session.user.id },
      data: {
        password: hashed,
        isTemporaryPassword: false,
      },
    });

    return Response.json({ ok: true });
  }

  return updateProfile(session.user.id, body);
}

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await req.json()) as ProfilePayload;

  return updateProfile(session.user.id, body);
}
