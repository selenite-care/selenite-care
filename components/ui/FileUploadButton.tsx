"use client";

import { ChangeEvent, useEffect, useId, useMemo, useState } from "react";

type FileUploadButtonProps = {
  onFileSelected: (file: File) => void;
  label?: string;
  accept?: string;
  currentPreviewUrl?: string;
};

export default function FileUploadButton({
  onFileSelected,
  label = "Choose File",
  accept = "image/*",
  currentPreviewUrl,
}: FileUploadButtonProps) {
  const inputId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const isImagePreview = useMemo(() => {
    if (selectedFile) {
      return selectedFile.type.startsWith("image/");
    }

    return Boolean(currentPreviewUrl);
  }, [currentPreviewUrl, selectedFile]);

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    onFileSelected(file);
  }

  const activePreviewUrl = previewUrl || currentPreviewUrl || "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
      />

      <label
        htmlFor={inputId}
        className="inline-flex cursor-pointer items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: "#2B2B2B",
          color: "#F8F5F0",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = "#884F38";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = "#2B2B2B";
        }}
      >
        {label}
      </label>

      <div className="flex min-h-[48px] items-center gap-3">
        {activePreviewUrl && isImagePreview ? (
          <>
            <div
              className="h-12 w-12 overflow-hidden rounded-md border"
              style={{
                borderColor: "#EADDCD",
                backgroundColor: "#F8F5F0",
              }}
            >
              <img
                src={activePreviewUrl}
                alt={selectedFile?.name ?? "Selected file preview"}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-sm" style={{ color: "#6E6257" }}>
              {selectedFile?.name ?? "Current image"}
            </span>
          </>
        ) : selectedFile ? (
          <span className="text-sm" style={{ color: "#6E6257" }}>
            {selectedFile.name}
          </span>
        ) : null}
      </div>
    </div>
  );
}
