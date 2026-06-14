"use client";

import { useEffect, useState } from "react";

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
  if (!value) return "Not saved yet";
  return new Date(value).toLocaleString();
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
      setLastSavedAt(data?.routineGuideline?.updatedAt ?? new Date().toISOString());
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
      <section
        className="rounded-2xl border p-6"
        style={{ backgroundColor: "#F8F5F0", borderColor: "#D8C7B5" }}
      >
        <p style={{ color: "#6E6257" }}>Loading routine...</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border p-6"
      style={{ backgroundColor: "#F8F5F0", borderColor: "#D8C7B5" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="text-sm font-semibold uppercase tracking-[0.16em]"
            style={{ color: "#C6A56B" }}
          >
            Routine
          </p>
        </div>

        {canEdit ? (
          <div className="text-sm" style={{ color: "#6E6257" }}>
            Last saved: {formatTimestamp(lastSavedAt)}
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <div className="mt-5 space-y-4">
          <label
            htmlFor={`routine-${bookingId}`}
            className="block text-sm font-medium"
            style={{ color: "#2B2B2B" }}
          >
            Routine & Guidelines
          </label>
          <textarea
            id={`routine-${bookingId}`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={8}
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            style={{ borderColor: "#D8C7B5", color: "#2B2B2B" }}
            placeholder="Write the skincare routine and guidelines here..."
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:bg-[#B8A89A] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
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
          className="mt-5 rounded-2xl border bg-white px-4 py-4 text-sm leading-7"
          style={{ borderColor: "#D8C7B5", color: "#6E6257" }}
        >
          {content || "No routine has been set yet"}
        </div>
      )}
    </section>
  );
}
