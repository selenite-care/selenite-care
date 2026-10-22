"use client";

import { Clock3, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TimeSlotSelector from "@/components/consultations/TimeSlotSelector";
import { toDhakaDateInput } from "@/lib/appointmentSchedule";
import { formatTimeSlot } from "@/lib/slotGenerator";

type BookingTimeSlotControlProps = {
  bookingId: string;
  doctorId: string | null;
  appointmentTime: string | null;
  currentTimeSlot: string | null;
  disabled?: boolean;
};

type TimeSlotUpdateResponse = {
  booking?: {
    timeSlot: string | null;
  };
  error?: string;
};

export default function BookingTimeSlotControl({
  bookingId,
  doctorId,
  appointmentTime,
  currentTimeSlot,
  disabled = false,
}: BookingTimeSlotControlProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const appointmentDate = appointmentTime
    ? toDhakaDateInput(new Date(appointmentTime))
    : "";
  const cannotChange = disabled || !doctorId || !appointmentDate;

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function openModal() {
    if (cannotChange) return;
    setSelectedTimeSlot("");
    setError("");
    setIsOpen(true);
  }

  async function saveTimeSlot() {
    if (!selectedTimeSlot || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/bookings/${encodeURIComponent(bookingId)}/timeslot`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ timeSlot: selectedTimeSlot }),
        },
      );
      const data = (await response.json().catch(() => null)) as
        | TimeSlotUpdateResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to update the time slot.");
      }

      setIsOpen(false);
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update the time slot.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={cannotChange}
        title={
          cannotChange
            ? "An active booking with a doctor and date is required."
            : "Change consultation time slot"
        }
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#B87B68] px-2.5 text-xs font-medium text-[#884F38] transition-colors hover:bg-[#B87B68] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#D9A694]"
      >
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        Change Time Slot
      </button>

      {isOpen && doctorId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close time-slot dialog"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-time-slot-title"
            className="relative z-10 max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-lg border border-[#EADDCD] bg-white p-5 shadow-2xl dark:border-[#3D3530] dark:bg-[#242220] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="change-time-slot-title"
                  className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  Change Consultation Time
                </h2>
                <p className="mt-2 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                  Current time: {currentTimeSlot
                    ? formatTimeSlot(currentTimeSlot)
                    : "Not assigned"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#EADDCD] text-[#6E6257] hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:text-[#B8AAA0] dark:hover:bg-[#1A1814]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <TimeSlotSelector
              doctorId={doctorId}
              date={appointmentDate}
              value={selectedTimeSlot}
              onChange={(value) => {
                setSelectedTimeSlot(value);
                setError("");
              }}
              compact
            />

            {error ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#EADDCD] px-4 text-sm font-medium text-[#2B2B2B] hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#1A1814]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveTimeSlot()}
                disabled={!selectedTimeSlot || isSubmitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#B87B68] dark:text-[#141210]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {isSubmitting ? "Saving..." : "Save Time Slot"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
