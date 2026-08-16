"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type AppSetting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

type SettingsResponse = {
  settings?: AppSetting[];
  error?: string;
};

const PRODUCT_DISCOUNT_PERCENT = "product_discount_percent";
const PRODUCT_DISCOUNT_ENABLED = "product_discount_enabled";
const PRODUCT_DISCOUNT_LABEL = "product_discount_label";
const MEMBERSHIP_SIGNATURE_PRICE = "membership_signature_price";
const MEMBERSHIP_SIGNATURE_ORIGINAL = "membership_signature_original";
const MEMBERSHIP_CRYSTAL_PRICE = "membership_crystal_price";
const MEMBERSHIP_PLATINUM_PRICE = "membership_platinum_price";

const DEFAULT_VALUES: Record<string, string> = {
  [PRODUCT_DISCOUNT_PERCENT]: "0",
  [PRODUCT_DISCOUNT_ENABLED]: "false",
  [PRODUCT_DISCOUNT_LABEL]: "Member Discount",
  [MEMBERSHIP_SIGNATURE_PRICE]: "990",
  [MEMBERSHIP_SIGNATURE_ORIGINAL]: "2190",
  [MEMBERSHIP_CRYSTAL_PRICE]: "4500",
  [MEMBERSHIP_PLATINUM_PRICE]: "12500",
};

const SETTING_KEYS = Object.keys(DEFAULT_VALUES);

function normalizeSettings(settings: AppSetting[]) {
  return SETTING_KEYS.reduce<Record<string, string>>((values, key) => {
    const setting = settings.find((item) => item.key === key);
    values[key] = setting?.value ?? DEFAULT_VALUES[key];
    return values;
  }, {});
}

function getUpdatedAt(settings: AppSetting[], key: string) {
  return settings.find((setting) => setting.key === key)?.updatedAt ?? null;
}

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Not saved yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function parseNumber(value: string) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [values, setValues] = useState<Record<string, string>>(DEFAULT_VALUES);
  const [initialValues, setInitialValues] =
    useState<Record<string, string>>(DEFAULT_VALUES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const discountPercent = Math.min(
    100,
    Math.max(0, parseNumber(values[PRODUCT_DISCOUNT_PERCENT] ?? "0")),
  );
  const exampleDiscountedPrice = Math.round(500 - (500 * discountPercent) / 100);
  const changedSettings = useMemo(
    () =>
      SETTING_KEYS.filter((key) => values[key] !== initialValues[key]).map(
        (key) => ({
          key,
          value: values[key] ?? "",
        }),
      ),
    [initialValues, values],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/settings", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | SettingsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load settings.");
        }

        const loadedSettings = data?.settings ?? [];
        const nextValues = normalizeSettings(loadedSettings);

        if (isMounted) {
          setSettings(loadedSettings);
          setValues(nextValues);
          setInitialValues(nextValues);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load settings.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateValue(key: string, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    if (changedSettings.length === 0) {
      toast.success("No setting changes to save.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: changedSettings,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | SettingsResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save settings.");
      }

      const updatedSettings = data?.settings ?? [];
      const nextValues = normalizeSettings(updatedSettings);

      setSettings(updatedSettings);
      setValues(nextValues);
      setInitialValues(nextValues);
      toast.success("Settings saved successfully.");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B87B68]">
            Admin Controls
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]">
            Settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]">
            Manage global discounts and membership package prices from one
            place.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || isSaving}
          className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#B87B68] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
        >
          {isSaving ? "Saving..." : "Save All Settings"}
        </button>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B87B68]">
              Product Discount
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Product Discount Settings
            </h2>
          </div>

          <div className="mt-6 space-y-5">
            <label className="flex items-center justify-between gap-4 rounded-xl border border-[#EADDCD] bg-[#F8F5F0] px-4 py-4 dark:border-[#3D3530] dark:bg-[#1A1814]">
              <span>
                <span className="block text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Enable Global Discount
                </span>
                <span className="mt-1 block text-xs text-[#6E6257] dark:text-[#8A7D75]">
                  Applies a public discount label and checkout discount.
                </span>
              </span>
              <input
                type="checkbox"
                checked={values[PRODUCT_DISCOUNT_ENABLED] === "true"}
                onChange={(event) =>
                  updateValue(
                    PRODUCT_DISCOUNT_ENABLED,
                    event.target.checked ? "true" : "false",
                  )
                }
                className="h-5 w-5 accent-[#B87B68]"
              />
            </label>

            <SettingInput
              label="Discount Percentage"
              type="number"
              min={0}
              max={100}
              value={values[PRODUCT_DISCOUNT_PERCENT] ?? ""}
              onChange={(value) => updateValue(PRODUCT_DISCOUNT_PERCENT, value)}
              updatedAt={formatUpdatedAt(
                getUpdatedAt(settings, PRODUCT_DISCOUNT_PERCENT),
              )}
            />

            <SettingInput
              label="Banner Label"
              value={values[PRODUCT_DISCOUNT_LABEL] ?? ""}
              placeholder="Example: Summer Glow Offer"
              onChange={(value) => updateValue(PRODUCT_DISCOUNT_LABEL, value)}
              updatedAt={formatUpdatedAt(
                getUpdatedAt(settings, PRODUCT_DISCOUNT_LABEL),
              )}
            />

            <div className="rounded-xl border border-[#B87B68]/30 bg-[#B87B68]/10 px-4 py-4 text-sm leading-6 text-[#2B2B2B] dark:text-[#F0EDE8]">
              Example: Product priced at 500 BDT will show as{" "}
              <span className="font-bold text-[#B87B68]">
                {exampleDiscountedPrice} BDT
              </span>{" "}
              with {discountPercent}% off
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B87B68]">
              Membership Prices
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Membership Package Prices
            </h2>
          </div>

          <div className="mt-6 space-y-5">
            <SettingInput
              label="Signature Offered Price"
              type="number"
              min={0}
              value={values[MEMBERSHIP_SIGNATURE_PRICE] ?? ""}
              onChange={(value) => updateValue(MEMBERSHIP_SIGNATURE_PRICE, value)}
              updatedAt={formatUpdatedAt(
                getUpdatedAt(settings, MEMBERSHIP_SIGNATURE_PRICE),
              )}
            />

            <SettingInput
              label="Signature Original Price"
              type="number"
              min={0}
              value={values[MEMBERSHIP_SIGNATURE_ORIGINAL] ?? ""}
              onChange={(value) =>
                updateValue(MEMBERSHIP_SIGNATURE_ORIGINAL, value)
              }
              updatedAt={formatUpdatedAt(
                getUpdatedAt(settings, MEMBERSHIP_SIGNATURE_ORIGINAL),
              )}
            />

            <SettingInput
              label="Crystal Price"
              type="number"
              min={0}
              value={values[MEMBERSHIP_CRYSTAL_PRICE] ?? ""}
              onChange={(value) => updateValue(MEMBERSHIP_CRYSTAL_PRICE, value)}
              updatedAt={formatUpdatedAt(
                getUpdatedAt(settings, MEMBERSHIP_CRYSTAL_PRICE),
              )}
            />

            <SettingInput
              label="Platinum Price"
              type="number"
              min={0}
              value={values[MEMBERSHIP_PLATINUM_PRICE] ?? ""}
              onChange={(value) => updateValue(MEMBERSHIP_PLATINUM_PRICE, value)}
              updatedAt={formatUpdatedAt(
                getUpdatedAt(settings, MEMBERSHIP_PLATINUM_PRICE),
              )}
            />

            <p className="rounded-xl border border-[#EADDCD] bg-[#F8F5F0] px-4 py-3 text-sm leading-6 text-[#6E6257] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]">
              Crystal and Platinum are currently hidden from clients. Prices
              will apply when packages are made available.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}

function SettingInput({
  label,
  value,
  onChange,
  updatedAt,
  type = "text",
  min,
  max,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  updatedAt: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
          {label}
        </label>
        <span className="text-xs text-[#8C7967] dark:text-[#8A7D75]">
          Last updated: {updatedAt}
        </span>
      </div>
      <input
        type={type}
        min={min}
        max={max}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-[#EADDCD] bg-[#F8F5F0] px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
      />
    </div>
  );
}
