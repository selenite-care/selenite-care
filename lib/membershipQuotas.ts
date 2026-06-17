export const MEMBERSHIP_QUOTAS = {
  SIGNATURE: { type: "total", limit: 2 },
  CRYSTAL: {
    type: "specialization",
    AESTHETICIAN: 7,
    NUTRITIONIST: 3,
    PSYCHIATRIST: 2,
  },
  PLATINUM: {
    type: "specialization",
    AESTHETICIAN: 21,
    NUTRITIONIST: 9,
    PSYCHIATRIST: null,
  },
} as const;

export type MembershipQuotaTier = keyof typeof MEMBERSHIP_QUOTAS;

type TotalUsedCounts = {
  total?: number;
};

type SpecializationUsedCounts = Partial<
  Record<"AESTHETICIAN" | "NUTRITIONIST" | "PSYCHIATRIST", number>
>;

type UsedCounts = TotalUsedCounts & SpecializationUsedCounts;

type TotalQuotaResult = {
  type: "total";
  limit: number;
  used: number;
  remaining: number;
  isUnlimited: false;
};

type SpecializationQuotaValue = {
  limit: number | null;
  used: number;
  remaining: number;
  isUnlimited: boolean;
};

type SpecializationQuotaResult = {
  type: "specialization";
  AESTHETICIAN: SpecializationQuotaValue;
  NUTRITIONIST: SpecializationQuotaValue;
  PSYCHIATRIST: SpecializationQuotaValue;
};

export function calculateRemainingQuota(
  tier: MembershipQuotaTier,
  usedCounts: UsedCounts = {},
): TotalQuotaResult | SpecializationQuotaResult {
  const quota = MEMBERSHIP_QUOTAS[tier];

  if (quota.type === "total") {
    const used = usedCounts.total ?? 0;

    return {
      type: "total",
      limit: quota.limit,
      used,
      remaining: Math.max(quota.limit - used, 0),
      isUnlimited: false,
    };
  }

  const createQuotaValue = (
    limit: number | null,
    used: number,
  ): SpecializationQuotaValue => ({
    limit,
    used,
    remaining: limit === null ? Number.POSITIVE_INFINITY : Math.max(limit - used, 0),
    isUnlimited: limit === null,
  });

  return {
    type: "specialization",
    AESTHETICIAN: createQuotaValue(
      quota.AESTHETICIAN,
      usedCounts.AESTHETICIAN ?? 0,
    ),
    NUTRITIONIST: createQuotaValue(
      quota.NUTRITIONIST,
      usedCounts.NUTRITIONIST ?? 0,
    ),
    PSYCHIATRIST: createQuotaValue(
      quota.PSYCHIATRIST,
      usedCounts.PSYCHIATRIST ?? 0,
    ),
  };
}
