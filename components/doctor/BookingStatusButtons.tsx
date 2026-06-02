"use client";

import { useState } from "react";

type BookingStatusButtonsProps = {
  bookingId: string;
  currentStatus: string;
};

type BookingStatusResponse = {
  booking?: {
    status?: string;
  };
};

export default function BookingStatusButtons({ bookingId, currentStatus }: BookingStatusButtonsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(newStatus: string) {
    if (newStatus === status) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/doctor/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to update status");
      }

      const data = (await response.json()) as BookingStatusResponse;
      setStatus(data.booking?.status ?? newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => updateStatus("PENDING")}
        disabled={loading || status === "PENDING"}
        className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
          status === "PENDING"
            ? "border-yellow-700 bg-yellow-50 text-yellow-800"
            : "border-black/10 bg-background text-foreground hover:bg-zinc-50"
        }`}
      >
        Mark Pending
      </button>

      <button
        type="button"
        onClick={() => updateStatus("COMPLETED")}
        disabled={loading || status === "COMPLETED"}
        className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
          status === "COMPLETED"
            ? "border-green-700 bg-green-50 text-green-800"
            : "border-black/10 bg-background text-foreground hover:bg-zinc-50"
        }`}
      >
        Mark Completed
      </button>

      {error ? <p className="ml-4 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
