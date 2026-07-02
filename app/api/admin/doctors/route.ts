import NextAuth from "next-auth";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const { auth } = NextAuth(authConfig);

type DoctorPayload = {
  name?: unknown;
  email?: unknown;
  designation?: unknown;
  specialization?: unknown;
  availability?: unknown;
  bio?: unknown;
  image?: unknown;
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

function parseDoctorPayload(body: DoctorPayload) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const designation =
    typeof body.designation === "string" ? body.designation.trim() : "";
  const specialization =
    typeof body.specialization === "string" ? body.specialization.trim() : "";
  const availability =
    typeof body.availability === "string" ? body.availability.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  if (!name || !email || !designation || !specialization || !availability) {
    return {
      error:
        "Name, email, designation, specialization, and availability are required.",
    };
  }

  if (!email.includes("@")) {
    return {
      error: "A valid email is required.",
    };
  }

  if (!doctorSpecializations.has(specialization as never)) {
    return {
      error: "A valid specialization is required.",
    };
  }

  return {
    data: {
      name,
      email,
      designation,
      specialization: specialization as
        | "AESTHETICIAN"
        | "NUTRITIONIST"
        | "PSYCHIATRIST",
      availability,
      bio: bio || null,
      image: image || null,
    },
  };
}

function generateTemporaryPassword(length = 10) {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";

  for (let i = 0; i < length; i += 1) {
    password += characters[Math.floor(Math.random() * characters.length)];
  }

  return password;
}

function getDoctorWelcomeEmailHtml(email: string, temporaryPassword: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #2B2B2B; line-height: 1.6;">
      <h1 style="color: #2B2B2B;">Welcome to Selenite Care</h1>
      <p>Your doctor account has been created.</p>
      <p>You can log in using the credentials below:</p>
      <table style="border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD; font-weight: bold;">Email</td>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD; font-weight: bold;">Temporary Password</td>
          <td style="padding: 8px 12px; border: 1px solid #EADDCD;">${temporaryPassword}</td>
        </tr>
      </table>
      <p style="margin-top: 16px;">Please change your password after logging in.</p>
    </div>
  `;
}

export async function GET() {
  const adminError = await requireAdmin();

  if (adminError) {
    return adminError;
  }

  const doctors = await db.doctor.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      designation: true,
      specialization: true,
      availability: true,
      bio: true,
      image: true,
      isActive: true,
    },
  });

  return Response.json({ doctors });
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

  const existingUser = await db.user.findUnique({
    where: {
      email: parsed.data.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return Response.json(
      { error: "A user with this email already exists." },
      { status: 409 },
    );
  }

  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const { doctor, user } = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        isTemporaryPassword: true,
        emailVerified: new Date(),
        role: "DOCTOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const doctor = await tx.doctor.create({
      data: {
        name: parsed.data.name,
        designation: parsed.data.designation,
        specialization: parsed.data.specialization,
        availability: parsed.data.availability,
        bio: parsed.data.bio,
        image: parsed.data.image,
        userId: user.id,
      },
    });

    return { doctor, user };
  });

  await sendEmail({
    to: parsed.data.email,
    subject: "Welcome to Selenite Care - Your Login Credentials",
    html: getDoctorWelcomeEmailHtml(parsed.data.email, temporaryPassword),
  });

  return Response.json(
    {
      doctor,
      user,
      credentials: {
        name: parsed.data.name,
        email: parsed.data.email,
        temporaryPassword,
      },
    },
    { status: 201 },
  );
}
