"use client";

import { useState } from "react";

type EstimatedDeliveryFormProps = {
  orderId: string;
  initialValue: string | null;
};

export default function EstimatedDeliveryForm({
  orderId,
  initialValue,
}: EstimatedDeliveryFormProps) {
  const [estimatedDelivery, setEstimatedDelivery] = useState(initialValue ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave() {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estimatedDelivery,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; order?: { estimatedDelivery?: string | null } }
        | null;

      if (!response.ok || !data?.order) {
        throw new Error(data?.error ?? "Unable to update estimated delivery.");
      }

      setEstimatedDelivery(data.order.estimatedDelivery ?? "");
      setMessage("Estimated delivery saved and client notified.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update estimated delivery.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <label
        htmlFor="estimated-delivery"
        className="text-muted font-medium"
      >
        Estimated Delivery
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="estimated-delivery"
          type="text"
          value={estimatedDelivery}
          onChange={(event) => setEstimatedDelivery(event.target.value)}
          placeholder="2-3 business days"
          className="h-10 min-w-0 flex-1 rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
        />
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
      {message ? (
        <p className="mt-2 text-xs text-green-700 dark:text-green-300">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
