"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BookingStatus = "PENDING" | "COMPLETED";

type BookingStatusButtonsProps = {
  bookingId: string;
  currentStatus: string;
};

type BookingStatusResponse = {
  booking?: {
    status?: string;
  };
  error?: string;
};

const statusActions: Array<{
  label: string;
  value: BookingStatus;
  activeClassName: string;
}> = [
  {
    label: "Mark Pending",
    value: "PENDING",
    activeClassName:
      "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-300",
  },
  {
    label: "Mark Completed",
    value: "COMPLETED",
    activeClassName:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300",
  },
];

export default function BookingStatusButtons({
  bookingId,
  currentStatus,
}: BookingStatusButtonsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: BookingStatus) {
    if (nextStatus === status) return;

    setPendingStatus(nextStatus);
    setError("");

    try {
      const response = await fetch(`/api/doctor/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await response.json().catch(() => null)) as BookingStatusResponse | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update booking status.");
      }

      setStatus(data?.booking?.status ?? nextStatus);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking status.");
    } finally {
      setPendingStatus(null);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
      <h2 className="text-lg font-semibold text-foreground">Booking Status</h2>
      <p className="mt-2 text-sm text-foreground/70">
        Current status: <span className="font-medium text-foreground">{status}</span>
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {statusActions.map((action) => {
          const isCurrent = status === action.value;
          const isPending = pendingStatus === action.value;

          return (
            <button
              key={action.value}
              type="button"
              onClick={() => updateStatus(action.value)}
              disabled={isCurrent || pendingStatus !== null}
              className={`inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                isCurrent
                  ? action.activeClassName
                  : "border-black/10 bg-background text-foreground hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
              }`}
            >
              {isPending ? "Updating..." : action.label}
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
