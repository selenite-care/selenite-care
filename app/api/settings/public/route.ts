import { auth } from "@/auth";
import {
  getProductDiscount,
  getSettings,
  MEMBERSHIP_CRYSTAL_PRICE,
  MEMBERSHIP_PLATINUM_PRICE,
  MEMBERSHIP_SIGNATURE_ORIGINAL,
  MEMBERSHIP_SIGNATURE_PRICE,
} from "@/lib/settings";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const session = await auth();
  const { enabled, percent, label } = await getProductDiscount();
  const response: {
    discountEnabled: boolean;
    discountPercent: number;
    discountLabel: string;
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
