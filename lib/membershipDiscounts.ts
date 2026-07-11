export const MEMBERSHIP_PRICES = {
  SIGNATURE: { 
    price: 990,           // offered price
    originalPrice: 1200,  // regular price
    offerValidTill: '2026-07-30'  // offer expires July 30
  },
  CRYSTAL: { 
    price: 4500, 
    originalPrice: null, 
    offerValidTill: null 
  },
  PLATINUM: { 
    price: 12500, 
    originalPrice: null, 
    offerValidTill: null 
  },
} as const

export const PRODUCT_DISCOUNTS = {
  SIGNATURE: 0,   // no product discount
  CRYSTAL: 7,     // 7% off all products
  PLATINUM: 10,   // 10% off all products
} as const

// Duration in days for NEW purchases only
export const MEMBERSHIP_DURATIONS = {
  SIGNATURE: 90,   // 3 months (UPDATED — was 60 days)
  CRYSTAL: 365,    // 12 months
  PLATINUM: 1095,  // 36 months
} as const

export function getMembershipPrice(tier: string): number {
  return MEMBERSHIP_PRICES[tier as keyof typeof MEMBERSHIP_PRICES]?.price ?? 0
}

export function getMembershipDuration(tier: string): number {
  return MEMBERSHIP_DURATIONS[tier as keyof typeof MEMBERSHIP_DURATIONS] ?? 90
}

export function getProductDiscount(tier: string | null | undefined): number {
  if (!tier) return 0
  return PRODUCT_DISCOUNTS[tier as keyof typeof PRODUCT_DISCOUNTS] ?? 0
}

export function isSignatureOfferValid(): boolean {
  return new Date() <= new Date('2026-07-30T23:59:59')
}

export function calculateExpiresAt(tier: string, fromDate: Date = new Date()): Date {
  const days = getMembershipDuration(tier)
  const expiresAt = new Date(fromDate)
  expiresAt.setDate(expiresAt.getDate() + days)
  return expiresAt
}

export function calculateOrderTotal(
  subtotal: number,
  deliveryCharge: number,
  membershipTier: string | null
): {
  subtotal: number
  discountPercent: number
  discountAmount: number
  deliveryCharge: number
  total: number
} {
  const discountPercent = getProductDiscount(membershipTier)
  const discountAmount = Math.round((subtotal * discountPercent) / 100)
  const total = subtotal - discountAmount + deliveryCharge
  return { subtotal, discountPercent, discountAmount, deliveryCharge, total }
}