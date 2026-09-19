"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/dateUtils";

type SkinAnalysisReport = {
  id: string;
  createdAt: string;
  skinType: string | null;
  concerns: string[];
  pdfUrl: string | null;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

type SkinAnalysisReportsResponse = {
  analyses?: SkinAnalysisReport[];
  totalCount?: number;
  page?: number;
  totalPages?: number;
  error?: string;
};

type SkinAnalysisReportsPageProps = {
  apiPath: string;
};

const ITEMS_PER_PAGE = 20;
const skinTypes = ["All", "Oily", "Dry", "Combination", "Normal", "Sensitive"];

function getSkinTypeBadgeClasses(skinType: string | null) {
  switch (skinType) {
    case "Oily":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200";
    case "Dry":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-200";
    case "Combination":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-200";
    case "Sensitive":
      return "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900/50 dark:bg-pink-950/30 dark:text-pink-200";
    case "Normal":
    default:
      return "border-[#D4B47A] bg-[#FFF8E6] text-[#8A641D] dark:border-[#D4B47A]/60 dark:bg-[#3A3020] dark:text-[#F3DFA6]";
  }
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function SkinAnalysisReportsPage({
  apiPath,
}: SkinAnalysisReportsPageProps) {
  const [analyses, setAnalyses] = useState<SkinAnalysisReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [skinTypeFilter, setSkinTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [copiedPhone, setCopiedPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReports() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
        });

        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim());
        }

        if (skinTypeFilter !== "All") {
          params.set("skinType", skinTypeFilter);
        }

        const response = await fetch(`${apiPath}?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => null)) as
          | SkinAnalysisReportsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load skin analysis reports.");
        }

        setAnalyses(data?.analyses ?? []);
        setTotalCount(data?.totalCount ?? 0);
        setTotalPages(data?.totalPages ?? 1);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load skin analysis reports.",
        );
        setAnalyses([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        if (!controller.signal.aborted) {
          setHasLoaded(true);
          setIsLoading(false);
        }
      }
    }

    void loadReports();

    return () => controller.abort();
  }, [apiPath, currentPage, searchQuery, skinTypeFilter]);

  const pageLabel = useMemo(() => {
    if (totalCount === 0) {
      return "Showing 0 reports.";
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);
    return `Showing ${start}-${end} of ${totalCount} reports.`;
  }, [currentPage, totalCount]);

  async function handleCopyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      window.setTimeout(() => setCopiedPhone(""), 1600);
    } catch {
      setCopiedPhone("");
    }
  }

  function handleExportCsv() {
    const headers = [
      "Date/Time",
      "Client Name",
      "Phone",
      "Email",
      "Skin Type",
      "Concerns",
      "PDF URL",
    ];
    const rows = analyses.map((analysis) => [
      formatDateTime(analysis.createdAt),
      analysis.user?.name ?? "Visitor",
      analysis.user?.phone ?? "",
      analysis.user?.email ?? "",
      analysis.skinType ?? "",
      analysis.concerns.join(", "),
      analysis.pdfUrl ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => csvEscape(value)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "skin-analysis-reports.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-4 py-10 dark:bg-[#1A1814] sm:px-6">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Skin Analysis Reports
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
          Review AI skin analysis submissions and follow up with high-intent
          clients.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-[#D4B47A] bg-[#FFF8E6] p-5 text-[#2B2B2B] dark:bg-[#33291C] dark:text-[#F0EDE8]">
        <p className="text-base font-semibold">
          Call these clients to offer consultation and membership!
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-[#EADDCD] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
          <label>
            <span className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Search by name or phone
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Raisa or +880..."
              className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#8C7967] focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
            />
          </label>

          <label>
            <span className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Skin type
            </span>
            <select
              value={skinTypeFilter}
              onChange={(event) => {
                setSkinTypeFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
            >
              {skinTypes.map((skinType) => (
                <option key={skinType} value={skinType}>
                  {skinType}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={analyses.length === 0}
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export CSV
          </button>
        </div>

        <p className="mt-4 text-sm text-[#884F38] dark:text-[#8A7D75]">
          {pageLabel}
        </p>
        {isLoading && hasLoaded ? (
          <p className="mt-2 text-xs text-[#8C7967] dark:text-[#8A7D75]">
            Updating results...
          </p>
        ) : null}
      </div>

      {isLoading && !hasLoaded ? (
        <div className="mt-8">
          <SkeletonTable rows={6} cols={7} />
        </div>
      ) : null}

      {error ? (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!isLoading && !error ? (
        <>
          <div className="mt-6 overflow-hidden rounded-lg border border-[#EADDCD] bg-white dark:border-[#3D3530] dark:bg-[#242220]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-[#EADDCD] bg-[#F8F5F0] text-[#2B2B2B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date/Time</th>
                    <th className="px-4 py-3 font-medium">Client Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Skin Type</th>
                    <th className="px-4 py-3 font-medium">Top Concerns</th>
                    <th className="px-4 py-3 font-medium">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-[#884F38] dark:text-[#8A7D75]"
                      >
                        No skin analysis reports match your filters.
                      </td>
                    </tr>
                  ) : (
                    analyses.map((analysis) => (
                      <tr
                        key={analysis.id}
                        className="border-b border-[#EADDCD] last:border-0 dark:border-[#3D3530]"
                      >
                        <td className="px-4 py-4 text-[#5F524A] dark:text-[#D9C9BD]">
                          {formatDateTime(analysis.createdAt)}
                        </td>
                        <td className="px-4 py-4 font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {analysis.user?.name ?? "Visitor"}
                        </td>
                        <td className="px-4 py-4 text-[#5F524A] dark:text-[#D9C9BD]">
                          {analysis.user?.phone ? (
                            <div className="flex items-center gap-2">
                              <span>{analysis.user.phone}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleCopyPhone(analysis.user?.phone ?? "")
                                }
                                className="inline-flex h-8 items-center justify-center rounded-md border border-[#EADDCD] px-2 text-xs font-medium text-[#2B2B2B] transition-colors hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#1A1814]"
                              >
                                <Copy className="mr-1 h-3.5 w-3.5" />
                                {copiedPhone === analysis.user.phone
                                  ? "Copied"
                                  : "Copy"}
                              </button>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-4 py-4 text-[#5F524A] dark:text-[#D9C9BD]">
                          {analysis.user?.email ?? "N/A"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSkinTypeBadgeClasses(
                              analysis.skinType,
                            )}`}
                          >
                            {analysis.skinType ?? "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {analysis.concerns.slice(0, 3).length > 0 ? (
                              analysis.concerns.slice(0, 3).map((concern) => (
                                <span
                                  key={concern}
                                  className="rounded-full border border-[#EADDCD] bg-[#F8F5F0] px-2.5 py-1 text-xs text-[#884F38] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#D9C9BD]"
                                >
                                  {concern}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#8C7967] dark:text-[#8A7D75]">
                                None
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {analysis.pdfUrl ? (
                            <Link
                              href={analysis.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-3 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38]"
                            >
                              View PDF
                            </Link>
                          ) : (
                            <span className="text-[#8C7967] dark:text-[#8A7D75]">
                              N/A
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage <= 1}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#EADDCD] px-4 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#242220]"
            >
              Previous
            </button>
            <p className="text-sm text-[#884F38] dark:text-[#8A7D75]">
              Page {currentPage} of {totalPages}
            </p>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage >= totalPages}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#EADDCD] px-4 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#242220]"
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
