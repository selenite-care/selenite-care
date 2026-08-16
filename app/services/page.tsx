import ServicesClient from "./ServicesClient";
import { headers } from "next/headers";
import { MEMBERSHIP_PRICES } from "@/lib/membershipDiscounts";

export const revalidate = 3600;

type PublicSettingsResponse = {
  membershipPrices?: {
    signaturePrice?: number | null;
    signatureOriginal?: number | null;
    crystalPrice?: number | null;
    platinumPrice?: number | null;
  };
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

async function getMembershipPrices() {
  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("host");
  const cookie = headerStore.get("cookie") ?? "";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    (host ? `${protocol}://${host}` : "");

  if (!baseUrl) {
    return fallbackMembershipPrices;
  }

  try {
    const response = await fetch(`${baseUrl}/api/settings/public`, {
      headers: cookie ? { cookie } : undefined,
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      return fallbackMembershipPrices;
    }

    const data = (await response.json()) as PublicSettingsResponse;
    const prices = data.membershipPrices;

    return {
      SIGNATURE: {
        price: prices?.signaturePrice ?? fallbackMembershipPrices.SIGNATURE.price,
        originalPrice:
          prices?.signatureOriginal ??
          fallbackMembershipPrices.SIGNATURE.originalPrice,
      },
      CRYSTAL: {
        price: prices?.crystalPrice ?? fallbackMembershipPrices.CRYSTAL.price,
        originalPrice: fallbackMembershipPrices.CRYSTAL.originalPrice,
      },
      PLATINUM: {
        price: prices?.platinumPrice ?? fallbackMembershipPrices.PLATINUM.price,
        originalPrice: fallbackMembershipPrices.PLATINUM.originalPrice,
      },
    };
  } catch {
    return fallbackMembershipPrices;
  }
}

export default async function ServicesPage() {
  const membershipPrices = await getMembershipPrices();

  return <ServicesClient membershipPrices={membershipPrices} />;
}
