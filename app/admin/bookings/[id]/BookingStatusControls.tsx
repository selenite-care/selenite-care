"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statusOptions = [
  { label: "Mark Pending", value: "PENDING" },
  { label: "Confirm", value: "CONFIRMED" },
  { label: "Complete", value: "COMPLETED" },
  { label: "Cancel", value: "CANCELLED" },
] as const;

type BookingStatus = (typeof statusOptions)[number]["value"];

export default function BookingStatusControls({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
}) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(status: BookingStatus) {
    setError("");
    setPendingStatus(status);

    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      setError(data?.error ?? "Unable to update booking status.");
      setPendingStatus(null);
      return;
    }

    router.refresh();
  }

  return (
    <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
      <h2 className="text-lg font-semibold text-foreground">
        Booking Status Control
      </h2>
      <p className="mt-4 text-sm text-foreground/70">
        Current status:{" "}
        <span className="font-medium text-foreground">{currentStatus}</span>
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {statusOptions.map((statusOption) => {
          const isCurrent = currentStatus === statusOption.value;
          const isPending = pendingStatus === statusOption.value;

          return (
            <button
              key={statusOption.value}
              type="button"
              onClick={() => updateStatus(statusOption.value)}
              disabled={isCurrent || pendingStatus !== null}
              className="inline-flex h-10 items-center justify-center rounded-md border border-black/10 px-4 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5"
            >
              {isPending ? "Updating..." : statusOption.label}
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
