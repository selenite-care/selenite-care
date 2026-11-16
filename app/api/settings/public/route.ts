import { auth } from "@/auth";
import {
  COD_ENABLED,
  COD_INSIDE_DHAKA_ONLY,
  DELIVERY_CHARGE_INSIDE_DHAKA,
  DELIVERY_CHARGE_OUTSIDE_DHAKA,
  getProductDiscount,
  getSettings,
  MEMBERSHIP_CLASSIC_PRICE,
  MEMBERSHIP_CRYSTAL_PRICE,
  MEMBERSHIP_PLATINUM_PRICE,
  MEMBERSHIP_SIGNATURE_ORIGINAL,
  MEMBERSHIP_SIGNATURE_PRICE,
  ONE_TIME_CONSULTATION_OFFER_ENABLED,
  ONE_TIME_CONSULTATION_OFFER_EXPIRY,
  ONE_TIME_CONSULTATION_OFFER_LABEL,
  ONE_TIME_CONSULTATION_ORIGINAL_PRICE,
  ONE_TIME_CONSULTATION_PRICE,
} from "@/lib/settings";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  const session = await auth();
  const [
    { enabled, percent, label },
    consultationSettings,
    classicSettings,
    codSettings,
    deliverySettings,
  ] =
    await Promise.all([
      getProductDiscount(),
      getSettings([
        ONE_TIME_CONSULTATION_PRICE,
        ONE_TIME_CONSULTATION_ORIGINAL_PRICE,
        ONE_TIME_CONSULTATION_OFFER_LABEL,
        ONE_TIME_CONSULTATION_OFFER_ENABLED,
        ONE_TIME_CONSULTATION_OFFER_EXPIRY,
      ]),
      getSettings([MEMBERSHIP_CLASSIC_PRICE]),
      getSettings([COD_ENABLED, COD_INSIDE_DHAKA_ONLY]),
      getSettings([
        DELIVERY_CHARGE_INSIDE_DHAKA,
        DELIVERY_CHARGE_OUTSIDE_DHAKA,
      ]),
    ]);
  const currentPrice =
    parseSettingNumber(consultationSettings[ONE_TIME_CONSULTATION_PRICE]) ?? 0;
  const originalPrice =
    parseSettingNumber(
      consultationSettings[ONE_TIME_CONSULTATION_ORIGINAL_PRICE],
    ) ?? 0;
  const offerLabel =
    consultationSettings[ONE_TIME_CONSULTATION_OFFER_LABEL]?.trim() ?? "";
  const offerEnabled = parseSettingBoolean(
    consultationSettings[ONE_TIME_CONSULTATION_OFFER_ENABLED],
  );
  const offerExpiry =
    consultationSettings[ONE_TIME_CONSULTATION_OFFER_EXPIRY]?.trim() ?? "";
  const isOfferActive =
    offerEnabled &&
    currentPrice > 0 &&
    originalPrice > currentPrice &&
    /^\d{4}-\d{2}-\d{2}$/.test(offerExpiry) &&
    getTodayDateString() <= offerExpiry;
  const response: {
    discountEnabled: boolean;
    discountPercent: number;
    discountLabel: string;
    oneTimeConsultation: {
      currentPrice: number;
      originalPrice: number;
      offerLabel: string;
      offerEnabled: boolean;
      offerExpiry: string;
      isOfferActive: boolean;
    };
    cashOnDelivery: {
      enabled: boolean;
      insideDhakaOnly: boolean;
    };
    deliveryCharges: {
      insideDhaka: number;
      outsideDhaka: number;
    };
    membershipPrices?: {
      classicPrice?: number | null;
      signaturePrice?: number | null;
      signatureOriginal?: number | null;
      crystalPrice?: number | null;
      platinumPrice?: number | null;
    };
  } = {
    discountEnabled: enabled,
    discountPercent: percent,
    discountLabel: label,
    oneTimeConsultation: {
      currentPrice,
      originalPrice,
      offerLabel,
      offerEnabled,
      offerExpiry,
      isOfferActive,
    },
    cashOnDelivery: {
      enabled: parseSettingBoolean(codSettings[COD_ENABLED]),
      insideDhakaOnly: parseSettingBoolean(
        codSettings[COD_INSIDE_DHAKA_ONLY] ?? "false",
      ),
    },
    deliveryCharges: {
      insideDhaka: parseNonNegativeSettingNumber(
        deliverySettings[DELIVERY_CHARGE_INSIDE_DHAKA],
        100,
      ),
      outsideDhaka: parseNonNegativeSettingNumber(
        deliverySettings[DELIVERY_CHARGE_OUTSIDE_DHAKA],
        150,
      ),
    },
    membershipPrices: {
      classicPrice: parseSettingNumber(
        classicSettings[MEMBERSHIP_CLASSIC_PRICE],
      ),
    },
  };

  if (session?.user) {
    const settings = await getSettings([
      MEMBERSHIP_SIGNATURE_PRICE,
      MEMBERSHIP_SIGNATURE_ORIGINAL,
      MEMBERSHIP_CRYSTAL_PRICE,
      MEMBERSHIP_PLATINUM_PRICE,
    ]);

    response.membershipPrices = {
      ...response.membershipPrices,
      signaturePrice: parseSettingNumber(settings[MEMBERSHIP_SIGNATURE_PRICE]),
      signatureOriginal: parseSettingNumber(
        settings[MEMBERSHIP_SIGNATURE_ORIGINAL],
      ),
      crystalPrice: parseSettingNumber(settings[MEMBERSHIP_CRYSTAL_PRICE]),
      platinumPrice: parseSettingNumber(settings[MEMBERSHIP_PLATINUM_PRICE]),
    };
  }

  return Response.json(response);
}

function parseSettingNumber(value: string | undefined) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function parseSettingBoolean(value: string | undefined) {
  return ["true", "1", "yes", "on"].includes(
    value?.trim().toLowerCase() ?? "",
  );
}

function parseNonNegativeSettingNumber(
  value: string | undefined,
  fallback: number,
) {
  if (!value?.trim()) {
    return fallback;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0
    ? numberValue
    : fallback;
}

function getTodayDateString() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}
