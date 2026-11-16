import type { DeliveryArea } from "@prisma/client";
import {
  DELIVERY_CHARGE_INSIDE_DHAKA,
  DELIVERY_CHARGE_OUTSIDE_DHAKA,
  getSettings,
} from "@/lib/settings";

export type CheckoutDeliveryArea = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";

export const DEFAULT_DELIVERY_CHARGES: Record<CheckoutDeliveryArea, number> = {
  INSIDE_DHAKA: 100,
  OUTSIDE_DHAKA: 150,
};

function parseCharge(value: string | undefined, fallback: number) {
  if (!value?.trim()) {
    return fallback;
  }

  const charge = Number(value);
  return Number.isFinite(charge) && charge >= 0 ? charge : fallback;
}

export function isCheckoutDeliveryArea(
  value: unknown,
): value is CheckoutDeliveryArea {
  return value === "INSIDE_DHAKA" || value === "OUTSIDE_DHAKA";
}

export async function getDeliveryCharges(): Promise<
  Record<CheckoutDeliveryArea, number>
> {
  const settings = await getSettings([
    DELIVERY_CHARGE_INSIDE_DHAKA,
    DELIVERY_CHARGE_OUTSIDE_DHAKA,
  ]);

  return {
    INSIDE_DHAKA: parseCharge(
      settings[DELIVERY_CHARGE_INSIDE_DHAKA],
      DEFAULT_DELIVERY_CHARGES.INSIDE_DHAKA,
    ),
    OUTSIDE_DHAKA: parseCharge(
      settings[DELIVERY_CHARGE_OUTSIDE_DHAKA],
      DEFAULT_DELIVERY_CHARGES.OUTSIDE_DHAKA,
    ),
  };
}

export function getDeliveryAreaLabel(deliveryArea: DeliveryArea) {
  switch (deliveryArea) {
    case "INSIDE_DHAKA":
      return "Inside Dhaka";
    case "SUB_DHAKA":
      return "Sub Dhaka";
    case "OUTSIDE_DHAKA":
      return "Outside Dhaka";
  }
}

