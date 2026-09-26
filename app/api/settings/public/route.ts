import { auth } from "@/auth";
import {
  getProductDiscount,
  getSettings,
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
export const revalidate = 300;

export async function GET() {
  const session = await auth();
  const [{ enabled, percent, label }, consultationSettings] = await Promise.all([
    getProductDiscount(),
    getSettings([
      ONE_TIME_CONSULTATION_PRICE,
      ONE_TIME_CONSULTATION_ORIGINAL_PRICE,
      ONE_TIME_CONSULTATION_OFFER_LABEL,
      ONE_TIME_CONSULTATION_OFFER_ENABLED,
      ONE_TIME_CONSULTATION_OFFER_EXPIRY,
    ]),
  ]);
  const currentPrice =
    parseSettingNumber(consultationSettings[ONE_TIME_CONSULTATION_PRICE]) ?? 99;
  const originalPrice =
    parseSettingNumber(
      consultationSettings[ONE_TIME_CONSULTATION_ORIGINAL_PRICE],
    ) ?? 500;
  const offerLabel =
    consultationSettings[ONE_TIME_CONSULTATION_OFFER_LABEL]?.trim() ?? "";
  const offerEnabled = parseSettingBoolean(
    consultationSettings[ONE_TIME_CONSULTATION_OFFER_ENABLED],
  );
  const offerExpiry =
    consultationSettings[ONE_TIME_CONSULTATION_OFFER_EXPIRY]?.trim() ?? "";
  const isOfferActive =
    offerEnabled &&
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
    membershipPrices?: {
      signaturePrice: number | null;
      signatureOriginal: number | null;
      crystalPrice: number | null;
      platinumPrice: number | null;
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
  };

  if (session?.user) {
    const settings = await getSettings([
      MEMBERSHIP_SIGNATURE_PRICE,
      MEMBERSHIP_SIGNATURE_ORIGINAL,
      MEMBERSHIP_CRYSTAL_PRICE,
      MEMBERSHIP_PLATINUM_PRICE,
    ]);

    response.membershipPrices = {
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
