import ServicesClient from "./ServicesClient";
import { headers } from "next/headers";
import { MEMBERSHIP_PRICES } from "@/lib/membershipDiscounts";
import {
  DEFAULT_ONE_TIME_CONSULTATION_PRICING,
  normalizeOneTimeConsultationPricing,
  type OneTimeConsultationPricing,
} from "@/lib/oneTimeConsultationPricing";

export const revalidate = 3600;

type PublicSettingsResponse = {
  membershipPrices?: {
    signaturePrice?: number | null;
    signatureOriginal?: number | null;
    crystalPrice?: number | null;
    platinumPrice?: number | null;
  };
  oneTimeConsultation?: Partial<OneTimeConsultationPricing>;
};

const fallbackMembershipPrices = {
  SIGNATURE: {
    price: MEMBERSHIP_PRICES.SIGNATURE.price,
    originalPrice: MEMBERSHIP_PRICES.SIGNATURE.originalPrice,
  },
  CRYSTAL: {
    price: MEMBERSHIP_PRICES.CRYSTAL.price,
    originalPrice: MEMBERSHIP_PRICES.CRYSTAL.originalPrice,
  },
  PLATINUM: {
    price: MEMBERSHIP_PRICES.PLATINUM.price,
    originalPrice: MEMBERSHIP_PRICES.PLATINUM.originalPrice,
  },
};

async function getServiceSettings() {
  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("host");
  const cookie = headerStore.get("cookie") ?? "";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    (host ? `${protocol}://${host}` : "");

  if (!baseUrl) {
    return {
      membershipPrices: fallbackMembershipPrices,
      oneTimeConsultation: DEFAULT_ONE_TIME_CONSULTATION_PRICING,
    };
  }

  try {
    const response = await fetch(`${baseUrl}/api/settings/public`, {
      headers: cookie ? { cookie } : undefined,
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      return {
        membershipPrices: fallbackMembershipPrices,
        oneTimeConsultation: DEFAULT_ONE_TIME_CONSULTATION_PRICING,
      };
    }

    const data = (await response.json()) as PublicSettingsResponse;
    const prices = data.membershipPrices;

    return {
      membershipPrices: {
        SIGNATURE: {
          price:
            prices?.signaturePrice ?? fallbackMembershipPrices.SIGNATURE.price,
          originalPrice:
            prices?.signatureOriginal ??
            fallbackMembershipPrices.SIGNATURE.originalPrice,
        },
        CRYSTAL: {
          price: prices?.crystalPrice ?? fallbackMembershipPrices.CRYSTAL.price,
          originalPrice: fallbackMembershipPrices.CRYSTAL.originalPrice,
        },
        PLATINUM: {
          price:
            prices?.platinumPrice ?? fallbackMembershipPrices.PLATINUM.price,
          originalPrice: fallbackMembershipPrices.PLATINUM.originalPrice,
        },
      },
      oneTimeConsultation: normalizeOneTimeConsultationPricing(
        data.oneTimeConsultation,
      ),
    };
  } catch {
    return {
      membershipPrices: fallbackMembershipPrices,
      oneTimeConsultation: DEFAULT_ONE_TIME_CONSULTATION_PRICING,
    };
  }
}

export default async function ServicesPage() {
  const { membershipPrices, oneTimeConsultation } = await getServiceSettings();

  return (
    <ServicesClient
      membershipPrices={membershipPrices}
      oneTimeConsultation={oneTimeConsultation}
    />
  );
}
