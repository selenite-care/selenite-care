"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";

type ReportDownloadButtonProps = {
  prescriptionId: string;
  label?: string;
  className?: string;
};

function getErrorMessage(data: unknown) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Unable to prepare this report download.";
}

export default function ReportDownloadButton({
  prescriptionId,
  label = "Download",
  className,
}: ReportDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    const downloadWindow = window.open("", "_blank");

    if (!downloadWindow) {
      setError("Your browser blocked the download tab. Allow pop-ups and try again.");
      return;
    }

    downloadWindow.document.title = "Preparing consultation report...";
    downloadWindow.document.body.textContent = "Preparing consultation report...";
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/prescriptions/download/${prescriptionId}`,
        { cache: "no-store" },
      );
      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !data?.url) {
        throw new Error(getErrorMessage(data));
      }

      downloadWindow.opener = null;
      downloadWindow.location.replace(data.url);
    } catch (downloadError) {
      downloadWindow.close();
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download this report.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isLoading}
        className={
          className ??
          "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-4 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D09A87]"
        }
      >
        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        {isLoading ? "Preparing..." : label}
      </button>
      {error ? (
        <p className="mt-2 max-w-xs text-xs leading-5 text-red-600 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
