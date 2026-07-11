import { auth } from "@/auth";
import {
  generateTransactionId,
  getEPSCallbackUrls,
  initializeEPSPayment,
} from "@/lib/eps";
import { db } from "@/lib/db";
import type { MembershipTier } from "@prisma/client";

export const runtime = "nodejs";

type InitiateMembershipPayload = {
  tier?: unknown;
};

const MEMBERSHIP_AMOUNTS: Record<MembershipTier, number> = {
  SIGNATURE: 490,
  CRYSTAL: 3990,
  PLATINUM: 9990,
};

function parseTier(value: unknown): MembershipTier | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (
    normalized === "SIGNATURE" ||
    normalized === "CRYSTAL" ||
    normalized === "PLATINUM"
  ) {
    return normalized;
  }

  return null;
}

async function generateMembershipId() {
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const prefix = `SCM${yearSuffix}`;

  const latestMembership = await db.membership.findFirst({
    where: {
      membershipId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      membershipId: "desc",
    },
    select: {
      membershipId: true,
    },
  });

  const latestSerial = latestMembership
    ? Number(latestMembership.membershipId.slice(-4))
    : 0;

  return `${prefix}${String(latestSerial + 1).padStart(4, "0")}`;
}

function normalizeCustomerPhone(phone: string | null) {
  const normalizedPhone = phone?.replace(/\D/g, "").slice(-11);
  return normalizedPhone || "01000000000";
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | InitiateMembershipPayload
      | null;
    const tier = parseTier(body?.tier);

    if (!tier) {
      return Response.json(
        { error: "Valid tier is required." },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    });

    if (!user?.email) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const amount = MEMBERSHIP_AMOUNTS[tier];
    const membershipId = await generateMembershipId();
    const merchantTransactionId = generateTransactionId();

    const { successUrl, failUrl, cancelUrl } = getEPSCallbackUrls(
      "membership",
      membershipId,
    );

    const payment = await initializeEPSPayment({
      customerOrderId: membershipId,
      merchantTransactionId,
      totalAmount: amount,
      successUrl,
      failUrl,
      cancelUrl,
      customerName: user.name || "Selenite Care Client",
      customerEmail: user.email,
      customerPhone: normalizeCustomerPhone(user.phone),
      customerAddress: user.address || "Dhaka",
      productName: `${tier} Membership - Selenite Care`,
      valueA: membershipId,
      valueB: session.user.id,
    });

    if (!payment.redirectUrl) {
      throw new Error("EPS did not return a payment redirect URL.");
    }

    await db.$transaction(async (tx) => {
      await tx.membershipPayment.updateMany({
        where: {
          membership: {
            is: {
              userId: user.id,
              status: "PENDING",
            },
          },
          epsMerchantTxnId: {
            not: null,
          },
          status: "UNPAID",
        },
        data: {
          epsStatus: "Superseded",
        },
      });

      await tx.membership.updateMany({
        where: {
          userId: user.id,
          status: "PENDING",
          payment: {
            is: {
              epsMerchantTxnId: {
                not: null,
              },
              status: "UNPAID",
            },
          },
        },
        data: {
          status: "CANCELLED",
        },
      });

      const membership = await tx.membership.create({
        data: {
          membershipId,
          userId: user.id,
          tier,
          status: "PENDING",
        },
        select: {
          id: true,
        },
      });

      await tx.membershipPayment.create({
        data: {
          membershipId: membership.id,
          paymentMethod: "STRIPE",
          status: "UNPAID",
          amount,
          epsMerchantTxnId: merchantTransactionId,
        },
      });
    });

    return Response.json({
      redirectUrl: payment.redirectUrl,
      membershipId,
    });
  } catch (error) {
    console.error("EPS membership initiate failed:", error);

    return Response.json(
      { error: "Unable to initiate EPS membership payment." },
      { status: 500 },
    );
  }
}
