"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";

type UploadResponse = {
  secure_url?: string;
  error?: string;
};

type ProfileResponse = {
  user?: {
    image: string | null;
  };
  error?: string;
};

type ProfilePhotoSectionProps = {
  initialImage: string | null;
  name: string | null;
  hasGoogleAccount: boolean;
};

export default function ProfilePhotoSection({
  initialImage,
  name,
  hasGoogleAccount,
}: ProfilePhotoSectionProps) {
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [currentImage, setCurrentImage] = useState(initialImage);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setMessage("");
    setError("");

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSavePhoto() {
    if (!selectedFile) {
      setError("Please choose a photo first.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch("/api/client/upload-avatar", {
        method: "POST",
        body: formData,
      });
      const uploadData = (await uploadResponse.json().catch(() => null)) as
        | UploadResponse
        | null;

      if (!uploadResponse.ok || !uploadData?.secure_url) {
        throw new Error(uploadData?.error ?? "Unable to upload photo.");
      }

      const profileResponse = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: uploadData.secure_url }),
      });
      const profileData = (await profileResponse.json().catch(() => null)) as
        | ProfileResponse
        | null;

      if (!profileResponse.ok) {
        throw new Error(profileData?.error ?? "Unable to save profile photo.");
      }

      const savedImage = profileData?.user?.image ?? uploadData.secure_url;

      setCurrentImage(savedImage);
      setSelectedFile(null);
      setPreviewUrl(null);
      await update({ user: { image: savedImage } });
      setMessage("Profile photo updated!");

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save profile photo.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="bg-card border-themed rounded-lg border p-6">
      <div className="flex flex-col items-center text-center">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Selected profile preview"
            className="h-24 w-24 rounded-full border-2 border-[#EADDCD] object-cover"
          />
        ) : (
          <Avatar imageUrl={currentImage} name={name} size="xl" />
        )}

        <h2
          className="text-page mt-5 text-lg font-semibold"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Profile Photo
        </h2>

        {hasGoogleAccount ? (
          <p className="text-muted mt-2 max-w-md text-sm leading-6">
            Your Google profile photo was used automatically. You can change it
            anytime.
          </p>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#B87B68] px-4 text-sm font-medium text-[#B87B68] transition-colors hover:bg-[#B87B68]/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Update Photo
          </button>

          {selectedFile ? (
            <button
              type="button"
              onClick={handleSavePhoto}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#3A3734] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
            >
              {isSaving ? "Saving..." : "Save Photo"}
            </button>
          ) : null}
        </div>

        {message ? (
          <p className="mt-4 text-sm font-medium text-[#8A6A2F] dark:text-[#D4B47A]">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
