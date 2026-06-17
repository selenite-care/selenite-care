import { db } from "@/lib/db";
import {
  calculateRemainingQuota,
  type MembershipQuotaTier,
} from "@/lib/membershipQuotas";

const membershipQuotaSelect = {
  id: true,
  userId: true,
  tier: true,
  status: true,
  createdAt: true,
  expiresAt: true,
} as const;

function serializeQuotaBreakdown(
  quotaBreakdown: ReturnType<typeof calculateRemainingQuota>,
) {
  if (quotaBreakdown.type === "total") {
    return quotaBreakdown;
  }

  return {
    type: "specialization" as const,
    AESTHETICIAN: {
      ...quotaBreakdown.AESTHETICIAN,
      remaining: quotaBreakdown.AESTHETICIAN.isUnlimited
        ? null
        : quotaBreakdown.AESTHETICIAN.remaining,
    },
    NUTRITIONIST: {
      ...quotaBreakdown.NUTRITIONIST,
      remaining: quotaBreakdown.NUTRITIONIST.isUnlimited
        ? null
        : quotaBreakdown.NUTRITIONIST.remaining,
    },
    PSYCHIATRIST: {
      ...quotaBreakdown.PSYCHIATRIST,
      remaining: quotaBreakdown.PSYCHIATRIST.isUnlimited
        ? null
        : quotaBreakdown.PSYCHIATRIST.remaining,
    },
  };
}

async function hydrateMembershipQuota(
  membership: {
    id: string;
    userId: string;
    tier: MembershipQuotaTier;
    status: string;
    createdAt: Date;
    expiresAt: Date | null;
  } | null,
) {
  if (!membership) {
    return null;
  }

  let activeMembership = membership;

  if (
    activeMembership.status === "ACTIVE" &&
    activeMembership.expiresAt &&
    activeMembership.expiresAt.getTime() < Date.now()
  ) {
    activeMembership = await db.membership.update({
      where: {
        id: activeMembership.id,
      },
      data: {
        status: "EXPIRED",
      },
      select: membershipQuotaSelect,
    });
  }

  const bookings = await db.booking.findMany({
    where: {
      userId: activeMembership.userId,
      createdAt: {
        gte: activeMembership.createdAt,
      },
      status: {
        not: "CANCELLED",
      },
    },
    select: {
      id: true,
      doctor: {
        select: {
          specialization: true,
        },
      },
    },
  });

  const quotaBreakdown =
    activeMembership.tier === "SIGNATURE"
      ? calculateRemainingQuota(activeMembership.tier, { total: bookings.length })
      : calculateRemainingQuota(activeMembership.tier, {
          AESTHETICIAN: bookings.filter(
            (booking) => booking.doctor?.specialization === "AESTHETICIAN",
          ).length,
          NUTRITIONIST: bookings.filter(
            (booking) => booking.doctor?.specialization === "NUTRITIONIST",
          ).length,
          PSYCHIATRIST: bookings.filter(
            (booking) => booking.doctor?.specialization === "PSYCHIATRIST",
          ).length,
        });

  return {
    membership: {
      id: activeMembership.id,
      tier: activeMembership.tier,
      status: activeMembership.status,
      expiresAt: activeMembership.expiresAt,
    },
    quota: serializeQuotaBreakdown(quotaBreakdown),
  };
}

export async function getLatestMembershipQuotaSummary(userId: string) {
  const membership = await db.membership.findFirst({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: membershipQuotaSelect,
  });

  return hydrateMembershipQuota(membership);
}

export async function getMembershipQuotaSummaryById(membershipId: string) {
  const membership = await db.membership.findUnique({
    where: {
      id: membershipId,
    },
    select: membershipQuotaSelect,
  });

  return hydrateMembershipQuota(membership);
}
