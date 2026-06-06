import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type ServicePayload = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  details?: unknown;
  price?: unknown;
  originalPrice?: unknown;
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

function parseServicePayload(body: ServicePayload) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const details = typeof body.details === "string" ? body.details.trim() : "";
  const price = Number(body.price);
  const originalPrice =
    body.originalPrice === undefined ||
    body.originalPrice === null ||
    body.originalPrice === ""
      ? null
      : Number(body.originalPrice);

  if (!name) {
    return {
      error: "Name is required.",
    };
  }

  if (!Number.isFinite(price) || price < 0) {
    return {
      error: "A valid price is required.",
    };
  }

  if (
    originalPrice !== null &&
    (!Number.isFinite(originalPrice) || originalPrice < 0)
  ) {
    return {
      error: "Original price must be a valid number.",
    };
  }

  return {
    data: {
      name,
      description: description || null,
      details: details || null,
      price,
      originalPrice,
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
  });

  return Response.json({ services });
}

export async function POST(request: Request) {
  const adminError = await requireAdmin();

  if (adminError) {
    return adminError;
  }

  const body = (await request.json()) as ServicePayload;
  const parsed = parseServicePayload(body);

  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const service = await db.service.create({
    data: parsed.data,
  });

  return Response.json({ service }, { status: 201 });
}

export async function PUT(request: Request) {
  const adminError = await requireAdmin();

  if (adminError) {
    return adminError;
  }

  const body = (await request.json()) as ServicePayload;
  const id = typeof body.id === "string" ? body.id : "";
  const parsed = parseServicePayload(body);

  if (!id) {
    return Response.json({ error: "Service ID is required." }, { status: 400 });
  }

  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const service = await db.service.update({
    where: { id },
    data: parsed.data,
  });

  return Response.json({ service });
}

export async function DELETE(request: Request) {
  const adminError = await requireAdmin();

  if (adminError) {
    return adminError;
  }

  const body = (await request.json()) as ServicePayload;
  const id = typeof body.id === "string" ? body.id : "";

  if (!id) {
    return Response.json({ error: "Service ID is required." }, { status: 400 });
  }

  await db.service.delete({
    where: { id },
  });

  return Response.json({ success: true });
}
