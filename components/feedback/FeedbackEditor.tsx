"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import FileUploadButton from "@/components/ui/FileUploadButton";

type FeedbackEditorProps = {
  bookingId: string;
  canEdit: boolean;
};

type CustomerFeedbackResponse = {
  customerFeedback: {
    id: string;
    bookingId: string;
    feedback: string | null;
    images: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
  error?: string;
};

function formatTimestamp(value: string | null) {
  if (!value) return "Not saved yet";
  return new Date(value).toLocaleString();
}

export default function FeedbackEditor({
  bookingId,
  canEdit,
}: FeedbackEditorProps) {
  const [feedback, setFeedback] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
        setImages(data?.customerFeedback?.images ?? []);
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

  async function handleUpload(file: File) {
    if (images.length >= 2) {
      setError("You can upload a maximum of 2 images.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const uploadedUrls: string[] = [];
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/feedback/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as
        | { secure_url?: string; error?: string }
        | null;

      if (!response.ok || !data?.secure_url) {
        throw new Error(data?.error ?? "Unable to upload image.");
      }

      uploadedUrls.push(data.secure_url);

      setImages((currentImages) => [...currentImages, ...uploadedUrls].slice(0, 2));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Unable to upload image.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemoveImage(imageUrl: string) {
    setImages((currentImages) =>
      currentImages.filter((currentImage) => currentImage !== imageUrl),
    );
  }

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
          images,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | CustomerFeedbackResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save feedback.");
      }

      setFeedback(data?.customerFeedback?.feedback ?? "");
      setImages(data?.customerFeedback?.images ?? []);
      setLastSavedAt(data?.customerFeedback?.updatedAt ?? new Date().toISOString());
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save feedback.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const isEmpty = !feedback.trim() && images.length === 0;

  if (isLoading) {
    return (
      <section
        className="rounded-2xl border p-6"
        style={{ backgroundColor: "#F8F5F0", borderColor: "#D8C7B5" }}
      >
        <p style={{ color: "#6E6257" }}>Loading feedback...</p>
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
          <div className="text-sm" style={{ color: "#6E6257" }}>
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
              style={{ color: "#2B2B2B" }}
            >
              Your Feedback
            </label> */}
            <textarea
              id={`feedback-${bookingId}`}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={6}
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              style={{ borderColor: "#D8C7B5", color: "#2B2B2B" }}
              placeholder="Share your feedback here..."
            />
          </div>

          <div>
            <label
              htmlFor={`feedback-images-${bookingId}`}
              className="block text-sm font-medium"
              style={{ color: "#2B2B2B" }}
            >
              Upload Images
            </label>
            <p className="mt-1 text-sm" style={{ color: "#6E6257" }}>
              You can upload up to 2 images.
            </p>
            <div className="mt-3">
              <FileUploadButton
                onFileSelected={(file) => {
                  if (isUploading || images.length >= 2) {
                    return;
                  }

                  void handleUpload(file);
                }}
                label={isUploading ? "Uploading..." : "Upload Image"}
                accept="image/*"
              />
            </div>
          </div>

          {images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {images.map((imageUrl) => (
                <div
                  key={imageUrl}
                  className="rounded-2xl border bg-white p-3"
                  style={{ borderColor: "#D8C7B5" }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                    <Image
                      src={imageUrl}
                      alt="Feedback upload preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(imageUrl)}
                    className="mt-3 inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-[#F8F5F0]"
                    style={{ borderColor: "#D8C7B5", color: "#2B2B2B" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || isUploading}
              className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:bg-[#B8A89A] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
            >
              {isUploading ? "Uploading..." : isSaving ? "Saving..." : "Save"}
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
          className="mt-5 rounded-2xl border bg-white px-4 py-4 text-sm leading-7"
          style={{ borderColor: "#D8C7B5", color: "#6E6257" }}
        >
          No feedback submitted yet
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div
            className="rounded-2xl border bg-white px-4 py-4 text-sm leading-7"
            style={{ borderColor: "#D8C7B5", color: "#6E6257" }}
          >
            {feedback || "No feedback submitted yet"}
          </div>

          {images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {images.map((imageUrl) => (
                <a
                  key={imageUrl}
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-2xl border bg-white p-3"
                  style={{ borderColor: "#D8C7B5" }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                    <Image
                      src={imageUrl}
                      alt="Feedback image"
                      fill
                      className="object-cover"
                    />
                  </div>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
