import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PatchPayload = {
  status?: unknown;
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
  const body = (await request.json().catch(() => ({}))) as PatchPayload;
  const status =
    typeof body.status === "string" ? body.status.trim().toUpperCase() : "";

  if (!id) {
    return Response.json({ error: "Membership ID is required." }, { status: 400 });
  }

  if (status !== "CANCELLED") {
    return Response.json(
      {
        error:
          "This endpoint can only cancel memberships. Use EPS verification or an approved admin activation flow to activate one.",
      },
      { status: 400 },
    );
  }

  const membership = await db.membership.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      payment: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return Response.json({ membership });
}
