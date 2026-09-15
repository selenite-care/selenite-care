"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/dateUtils";

type FeedbackEditorProps = {
  bookingId: string;
  canEdit: boolean;
};

type CustomerFeedbackResponse = {
  customerFeedback: {
    id: string;
    bookingId: string;
    feedback: string | null;
    images?: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
  error?: string;
};

function formatTimestamp(value: string | null) {
  return value ? formatDateTime(value) : "Not saved yet";
}

export default function FeedbackEditor({
  bookingId,
  canEdit,
}: FeedbackEditorProps) {
  const [feedback, setFeedback] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFeedback() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/feedback/${bookingId}`, {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | CustomerFeedbackResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load feedback.");
        }

        if (!isMounted) return;

        setFeedback(data?.customerFeedback?.feedback ?? "");
        setLastSavedAt(data?.customerFeedback?.updatedAt ?? null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load feedback.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFeedback();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  async function handleSave() {
    if (!canEdit) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/feedback/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | CustomerFeedbackResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save feedback.");
      }

      setFeedback(data?.customerFeedback?.feedback ?? "");
      setLastSavedAt(data?.customerFeedback?.updatedAt ?? new Date().toString());
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save feedback.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const isEmpty = !feedback.trim();

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[#EADDCD] bg-[#F8F5F0] p-6 dark:border-[#3D3530] dark:bg-[#242220]">
        <p className="text-[#6E6257] dark:text-[#8A7D75]">Loading feedback...</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#EADDCD] bg-[#F8F5F0] p-6 dark:border-[#3D3530] dark:bg-[#242220]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#B87B68]">
            Feedback
          </p>
          {/* <h2
            className="mt-2 text-2xl font-semibold"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Your Feedback
          </h2> */}
        </div>

        {canEdit ? (
          <div className="text-sm text-[#6E6257] dark:text-[#8A7D75]">
            Last saved: {formatTimestamp(lastSavedAt)}
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <div className="mt-5 space-y-5">
          <div>
            {/* <label
              htmlFor={`feedback-${bookingId}`}
              className="block text-sm font-medium"
              className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
            >
              Your Feedback
            </label> */}
            <textarea
              id={`feedback-${bookingId}`}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={6}
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm leading-7 text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
              placeholder="Share your feedback here..."
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>

            {error ? (
              <p className="text-sm" style={{ color: "#C84B4B" }}>
                {error}
              </p>
            ) : null}
          </div>
        </div>
      ) : isEmpty ? (
        <div
          className="mt-5 rounded-2xl border bg-white px-4 py-4 text-sm leading-7 text-[#6E6257] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
        >
          No feedback submitted yet
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div
            className="rounded-2xl border bg-white px-4 py-4 text-sm leading-7 text-[#6E6257] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
          >
            {feedback || "No feedback submitted yet"}
          </div>
        </div>
      )}
    </section>
  );
}
