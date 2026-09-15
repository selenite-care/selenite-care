import { auth } from "@/auth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateInfluencerPayload = {
  isActive?: unknown;
  commissionRate?: unknown;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  const influencer = await db.influencer.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          createdAt: true,
        },
      },
      referrals: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          client: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          membership: {
            select: {
              membershipId: true,
              tier: true,
              status: true,
            },
          },
        },
      },
      payments: {
        orderBy: {
          paidAt: "desc",
        },
      },
    },
  });

  if (!influencer) {
    return Response.json({ error: "Influencer not found." }, { status: 404 });
  }

  return Response.json({ influencer });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | UpdateInfluencerPayload
    | null;

  const data: {
    isActive?: boolean;
    commissionRate?: number;
  } = {};

  if (body && "isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      return Response.json(
        { error: "isActive must be a boolean." },
        { status: 400 },
      );
    }

    data.isActive = body.isActive;
  }

  if (body && "commissionRate" in body) {
    const commissionRate =
      typeof body.commissionRate === "number"
        ? body.commissionRate
        : typeof body.commissionRate === "string"
          ? Number(body.commissionRate)
          : Number.NaN;

    if (
      !Number.isFinite(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 100
    ) {
      return Response.json(
        { error: "Commission rate must be between 0 and 100." },
        { status: 400 },
      );
    }

    data.commissionRate = commissionRate;
  }

  if (Object.keys(data).length === 0) {
    return Response.json(
      { error: "No valid updates provided." },
      { status: 400 },
    );
  }

  const influencer = await db.influencer.update({
    where: {
      id,
    },
    data,
    select: {
      id: true,
      isActive: true,
      commissionRate: true,
    },
  });

  return Response.json({ influencer });
}
