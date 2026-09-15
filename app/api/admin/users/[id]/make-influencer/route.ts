import NextAuth from "next-auth";
import { Prisma, type Role } from "@prisma/client";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateReferralCode } from "@/lib/referralCode";

const { auth } = NextAuth(authConfig);

type MakeInfluencerPayload = {
  referralCode?: unknown;
  commissionRate?: unknown;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseCommissionRate(value: unknown) {
  const commissionRate =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(commissionRate) ? commissionRate : null;
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

  if (!id) {
    return Response.json(
      { error: "User ID is required." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | MakeInfluencerPayload
    | null;
  const referralCode =
    typeof body?.referralCode === "string"
      ? validateReferralCode(body.referralCode)
      : "";
  const commissionRate = parseCommissionRate(body?.commissionRate);

  if (!referralCode) {
    return Response.json(
      { error: "Referral code is required." },
      { status: 400 },
    );
  }

  if (commissionRate === null || commissionRate < 0 || commissionRate > 100) {
    return Response.json(
      { error: "Commission rate must be between 0 and 100." },
      { status: 400 },
    );
  }

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      influencer: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  if (user.role !== "CLIENT") {
    return Response.json(
      { error: "Only client users can be made influencers." },
      { status: 400 },
    );
  }

  if (user.influencer) {
    return Response.json(
      { error: "This user is already an influencer." },
      { status: 409 },
    );
  }

  const existingInfluencer = await db.influencer.findUnique({
    where: { referralCode },
    select: { id: true },
  });

  if (existingInfluencer) {
    return Response.json(
      { error: "Referral code is already in use." },
      { status: 409 },
    );
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const influencer = await tx.influencer.create({
        data: {
          userId: id,
          referralCode,
          commissionRate,
        },
        select: {
          id: true,
          referralCode: true,
          commissionRate: true,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          role: "INFLUENCER" as Role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          accounts: {
            where: {
              provider: "google",
            },
            take: 1,
            select: {
              provider: true,
            },
          },
          memberships: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              id: true,
              tier: true,
              status: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              memberships: true,
              orders: true,
            },
          },
        },
      });

      return { influencer, user: updatedUser };
    });

    return Response.json({ success: true, ...result });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "Referral code is already in use." },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Failed to make user an influencer." },
      { status: 500 },
    );
  }
}
