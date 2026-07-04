export const MEMBERSHIP_AVAILABILITY = {
  SIGNATURE: true,
  CRYSTAL: true,
  PLATINUM: true,
} as const;

export type MembershipAvailabilityTier = keyof typeof MEMBERSHIP_AVAILABILITY;

export function isMembershipAvailable(tier: MembershipAvailabilityTier) {
  return MEMBERSHIP_AVAILABILITY[tier];
}

export function getMembershipAvailabilityLabel(tier: MembershipAvailabilityTier) {
  return isMembershipAvailable(tier) ? "Available" : "Coming Soon";
}
