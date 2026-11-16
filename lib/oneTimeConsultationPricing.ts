export type OneTimeConsultationPricing = {
  currentPrice: number;
  originalPrice: number;
  offerLabel: string;
  offerEnabled: boolean;
  offerExpiry: string;
  isOfferActive: boolean;
};

export const DEFAULT_ONE_TIME_CONSULTATION_PRICING: OneTimeConsultationPricing = {
  currentPrice: 0,
  originalPrice: 0,
  offerLabel: "",
  offerEnabled: false,
  offerExpiry: "",
  isOfferActive: false,
};

export function normalizeOneTimeConsultationPricing(
  value?: Partial<OneTimeConsultationPricing> | null,
): OneTimeConsultationPricing {
  return {
    currentPrice:
      typeof value?.currentPrice === "number" &&
      Number.isFinite(value.currentPrice) &&
      value.currentPrice >= 0
        ? value.currentPrice
        : DEFAULT_ONE_TIME_CONSULTATION_PRICING.currentPrice,
    originalPrice:
      typeof value?.originalPrice === "number" &&
      Number.isFinite(value.originalPrice) &&
      value.originalPrice >= 0
        ? value.originalPrice
        : DEFAULT_ONE_TIME_CONSULTATION_PRICING.originalPrice,
    offerLabel:
      typeof value?.offerLabel === "string" ? value.offerLabel.trim() : "",
    offerEnabled: value?.offerEnabled === true,
    offerExpiry:
      typeof value?.offerExpiry === "string" ? value.offerExpiry : "",
    isOfferActive: value?.isOfferActive === true,
  };
}
