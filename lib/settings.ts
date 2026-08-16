import { db } from "@/lib/db";

export const PRODUCT_DISCOUNT_PERCENT = "product_discount_percent";
export const PRODUCT_DISCOUNT_ENABLED = "product_discount_enabled";
export const PRODUCT_DISCOUNT_LABEL = "product_discount_label";
export const MEMBERSHIP_SIGNATURE_PRICE = "membership_signature_price";
export const MEMBERSHIP_SIGNATURE_ORIGINAL = "membership_signature_original";
export const MEMBERSHIP_CRYSTAL_PRICE = "membership_crystal_price";
export const MEMBERSHIP_PLATINUM_PRICE = "membership_platinum_price";

export async function getSetting(key: string): Promise<string | null> {
  const setting = await db.appSetting.findUnique({
    where: { key },
    select: { value: true },
  });

  return setting?.value ?? null;
}

export async function getSettings(
  keys: string[],
): Promise<Record<string, string>> {
  if (keys.length === 0) {
    return {};
  }

  const settings = await db.appSetting.findMany({
    where: {
      key: {
        in: keys,
      },
    },
    select: {
      key: true,
      value: true,
    },
  });

  return settings.reduce<Record<string, string>>((values, setting) => {
    values[setting.key] = setting.value;
    return values;
  }, {});
}

export async function updateSetting(
  key: string,
  value: string,
  updatedBy?: string,
): Promise<void> {
  await db.appSetting.upsert({
    where: { key },
    update: {
      value,
      updatedBy,
    },
    create: {
      key,
      value,
      updatedBy,
    },
  });
}

export async function getProductDiscount(): Promise<{
  enabled: boolean;
  percent: number;
  label: string;
}> {
  const settings = await getSettings([
    PRODUCT_DISCOUNT_PERCENT,
    PRODUCT_DISCOUNT_ENABLED,
    PRODUCT_DISCOUNT_LABEL,
  ]);
  const enabledValue =
    settings[PRODUCT_DISCOUNT_ENABLED]?.trim().toLowerCase() ?? "";
  const rawPercent = Number(settings[PRODUCT_DISCOUNT_PERCENT] ?? 0);

  return {
    enabled: ["true", "1", "yes", "on"].includes(enabledValue),
    percent: Number.isFinite(rawPercent) ? rawPercent : 0,
    label: settings[PRODUCT_DISCOUNT_LABEL] ?? "",
  };
}
