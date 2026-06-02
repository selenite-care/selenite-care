"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelBookingButton({
  bookingId,
}: {
  bookingId: string;
}) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setIsCancelling(true);
    setError(null);

    try {
      const response = await fetch(`/api/client/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Unable to cancel booking.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel booking.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isCancelling}
        className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 bg-red-50 px-5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900/30"
      >
        {isCancelling ? "Cancelling..." : "Cancel Booking"}
      </button>
      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
