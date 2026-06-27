"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/dateUtils";

type RoutineEditorProps = {
  bookingId: string;
  canEdit: boolean;
};

type RoutineGuidelineResponse = {
  routineGuideline: {
    id: string;
    bookingId: string;
    content: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  error?: string;
};

function formatTimestamp(value: string | null) {
  return value ? formatDateTime(value) : "Not saved yet";
}

export default function RoutineEditor({
  bookingId,
  canEdit,
}: RoutineEditorProps) {
  const [content, setContent] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadRoutine() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/routine/${bookingId}`, {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | RoutineGuidelineResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load routine.");
        }

        if (!isMounted) return;

        setContent(data?.routineGuideline?.content ?? "");
        setLastSavedAt(data?.routineGuideline?.updatedAt ?? null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load routine.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRoutine();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  async function handleSave() {
    if (!canEdit) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/routine/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | RoutineGuidelineResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save routine.");
      }

      setContent(data?.routineGuideline?.content ?? "");
      setLastSavedAt(data?.routineGuideline?.updatedAt ?? new Date().toString());
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save routine.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[#D8C7B5] bg-[#F8F5F0] p-6 dark:border-[#3D3530] dark:bg-[#242220]">
        <p className="text-[#6E6257] dark:text-[#8A7D75]">Loading routine...</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#D8C7B5] bg-[#F8F5F0] p-6 dark:border-[#3D3530] dark:bg-[#242220]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C6A56B]">
            Routine
          </p>
          <h2
            className="mt-2 text-2xl font-semibold"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Routine & Guidelines
          </h2>
        </div>

        {canEdit ? (
          <div className="text-sm text-[#6E6257] dark:text-[#8A7D75]">
            Last saved: {formatTimestamp(lastSavedAt)}
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <div className="mt-5 space-y-4">
          <label
            htmlFor={`routine-${bookingId}`}
            className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
          >
            Routine & Guidelines
          </label>
          <textarea
            id={`routine-${bookingId}`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={8}
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm leading-7 text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
            
            placeholder="Write the skincare routine and guidelines here..."
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#B8A89A] disabled:cursor-not-allowed disabled:opacity-60"
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
      ) : (
        <div
          className="mt-5 rounded-2xl border border-[#D8C7B5] bg-white px-4 py-4 text-sm leading-7 text-[#6E6257] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
        >
          {content || "No routine has been set yet"}
        </div>
      )}
    </section>
  );
}
