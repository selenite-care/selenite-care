"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, LoaderCircle, Send } from "lucide-react";

type FollowUpDays = "" | "3" | "7" | "14" | "30" | "60";

type ReportVersion = {
  id: string;
  version: number;
  followUpDays: number | null;
  followUpDate: string | null;
  createdByRole: string;
  sentAt: string;
  downloadUrl: string;
};

type ReportListResponse = {
  prescriptions?: ReportVersion[];
  error?: string;
};

type ReportSendResponse = {
  prescription?: ReportVersion;
  error?: string;
};

type Action = "preview" | "send" | `download:${string}`;

const FOLLOW_UP_OPTIONS: Array<{ value: FollowUpDays; label: string }> = [
  { value: "", label: "No follow-up" },
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
];

function getErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return fallback;
}

function formatSentDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function fetchReportHistory(bookingId: string) {
  const response = await fetch(`/api/prescriptions/${bookingId}/list`, {
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as
    | ReportListResponse
    | null;

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Unable to load consultation report history."),
    );
  }

  return data?.prescriptions ?? [];
}

export default function ReportPanel({ bookingId }: { bookingId: string }) {
  const [followUpDays, setFollowUpDays] = useState<FollowUpDays>("");
  const [reports, setReports] = useState<ReportVersion[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isHistoryReady, setIsHistoryReady] = useState(false);
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const nextVersion = useMemo(
    () => Math.max(0, ...reports.map((report) => report.version)) + 1,
    [reports],
  );
  const isBusy = activeAction !== null;
  const selectedFollowUpDays = followUpDays ? Number(followUpDays) : null;

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);

    try {
      setReports(await fetchReportHistory(bookingId));
      setIsHistoryReady(true);
      setError("");
    } catch (historyError) {
      setReports([]);
      setIsHistoryReady(false);
      setError(
        historyError instanceof Error
          ? historyError.message
          : "Unable to load consultation report history.",
      );
    } finally {
      setIsHistoryLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    let isCurrent = true;

    fetchReportHistory(bookingId)
      .then((history) => {
        if (!isCurrent) return;
        setReports(history);
        setIsHistoryReady(true);
        setError("");
      })
      .catch((historyError: unknown) => {
        if (!isCurrent) return;
        setReports([]);
        setIsHistoryReady(false);
        setError(
          historyError instanceof Error
            ? historyError.message
            : "Unable to load consultation report history.",
        );
      })
      .finally(() => {
        if (isCurrent) setIsHistoryLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [bookingId]);

  async function handlePreview() {
    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      setError("Your browser blocked the preview tab. Allow pop-ups and try again.");
      return;
    }

    previewWindow.document.title = "Generating consultation report...";
    previewWindow.document.body.textContent = "Generating consultation report...";
    setActiveAction("preview");
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/prescriptions/${bookingId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpDays: selectedFollowUpDays }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          getErrorMessage(data, "Unable to generate the PDF preview."),
        );
      }

      const pdfUrl = URL.createObjectURL(await response.blob());
      previewWindow.location.replace(pdfUrl);
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
    } catch (previewError) {
      previewWindow.close();
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Unable to generate the PDF preview.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSend() {
    const confirmed = window.confirm(
      `This will send Version ${nextVersion} to the client. Make sure you saved all sections.`,
    );

    if (!confirmed) {
      return;
    }

    setActiveAction("send");
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/prescriptions/${bookingId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpDays: selectedFollowUpDays }),
      });
      const data = (await response.json().catch(() => null)) as
        | ReportSendResponse
        | null;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to send the consultation report."),
        );
      }

      setSuccessMessage(
        `Version ${data?.prescription?.version ?? nextVersion} was sent to the client.`,
      );
      await loadHistory();
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send the consultation report.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleDownload(report: ReportVersion) {
    const downloadWindow = window.open("", "_blank");

    if (!downloadWindow) {
      setError("Your browser blocked the download tab. Allow pop-ups and try again.");
      return;
    }

    downloadWindow.document.title = "Preparing consultation report...";
    downloadWindow.document.body.textContent = "Preparing consultation report...";
    setActiveAction(`download:${report.id}`);
    setError("");

    try {
      const response = await fetch(report.downloadUrl, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !data?.url) {
        throw new Error(
          getErrorMessage(data, "Unable to prepare this report download."),
        );
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
      setActiveAction(null);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-[#D8B6AA] bg-background p-4 dark:border-[#5A4139] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[#B87B68]">
            Client Report
          </p>
          <h2
            className="mt-2 text-2xl font-semibold text-foreground"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Consultation Report &amp; Skincare Plan
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground/65">
            Review the saved diagnosis, products, and routine before sending.
          </p>
        </div>
        <span className="text-xs font-medium text-foreground/55">
          Next version: {isHistoryLoading ? "..." : `V${nextVersion}`}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:items-end">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Follow-up</span>
          <select
            value={followUpDays}
            onChange={(event) =>
              setFollowUpDays(event.target.value as FollowUpDays)
            }
            disabled={isBusy}
            className="mt-2 h-11 w-full rounded-md border border-black/10 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10"
          >
            {FOLLOW_UP_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isBusy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#B87B68] bg-background px-4 text-sm font-semibold text-[#884F38] transition-colors hover:bg-[#F8EFEC] disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#E4B8AA] dark:hover:bg-[#2E211D]"
          >
            {activeAction === "preview" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileText className="h-4 w-4" aria-hidden="true" />
            )}
            {activeAction === "preview" ? "Generating..." : "Generate PDF"}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isBusy || !isHistoryReady}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-4 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D09A87]"
          >
            {activeAction === "send" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {activeAction === "send"
              ? "Sending..."
              : "Send to client's dashboard"}
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300"
        >
          {successMessage}
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-foreground/60">
        The report includes Problem Identification, Tests, Recommended Products
        and Additional Notes. Routine &amp; Guidelines is not part of the report.
        Save all sections before sending.
      </p>

      <div className="mt-6 border-t border-black/10 pt-5 dark:border-white/10">
        <h3 className="text-sm font-semibold text-foreground">Sent versions</h3>

        {isHistoryLoading ? (
          <div className="mt-3 space-y-2" aria-label="Loading report history">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-md bg-black/5 dark:bg-white/5"
              />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">
            No consultation reports have been sent yet.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-black/10 overflow-hidden rounded-md border border-black/10 dark:divide-white/10 dark:border-white/10">
            {reports.map((report) => {
              const isDownloading = activeAction === `download:${report.id}`;

              return (
                <div
                  key={report.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Version {report.version}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-foreground/60">
                      {formatSentDate(report.sentAt)} · Sent by {report.createdByRole}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(report)}
                    disabled={isBusy}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-black/10 px-3 text-sm font-medium text-foreground transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    {isDownloading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isDownloading ? "Preparing..." : "Download"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
