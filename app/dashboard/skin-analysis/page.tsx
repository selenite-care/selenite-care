"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/dateUtils";

type SkinAnalysisHistoryItem = {
  id: string;
  imageUrl: string[];
  skinType: string | null;
  concerns: string[];
  fullAnalysis: string;
  pdfUrl: string | null;
  createdAt: string;
};

type SkinAnalysisHistoryResponse = {
  analyses?: SkinAnalysisHistoryItem[];
  totalCount?: number;
  error?: string;
};

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

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function AnalysisCard({
  analysis,
  isExpanded,
  onToggle,
}: {
  analysis: SkinAnalysisHistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const topConcerns = analysis.concerns.slice(0, 3);
  const paragraphs = useMemo(
    () => splitParagraphs(analysis.fullAnalysis),
    [analysis.fullAnalysis],
  );

  return (
    <article className="bg-card border-themed overflow-hidden rounded-2xl border shadow-sm">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={analysis.imageUrl[0]}
          alt="Skin analysis photo"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 33vw"
          unoptimized
        />
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-[#8C7967] dark:text-[#8A7D75]">
            {formatDate(analysis.createdAt)}
          </p>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSkinTypeBadgeClasses(
              analysis.skinType,
            )}`}
          >
            {analysis.skinType ?? "Unknown"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {topConcerns.length > 0 ? (
            topConcerns.map((concern) => (
              <span
                key={concern}
                className="rounded-full border border-[#EADDCD] bg-[#F8F5F0] px-2.5 py-1 text-xs text-[#884F38] dark:border-[#3D3530] dark:bg-[#141210] dark:text-[#D9C9BD]"
              >
                {concern}
              </span>
            ))
          ) : (
            <span className="text-xs text-[#8C7967] dark:text-[#8A7D75]">
              No concerns listed
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
          >
            {isExpanded ? "Hide Report" : "View Report"}
          </button>

          {analysis.pdfUrl ? (
            <a
              href={analysis.pdfUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#EADDCD] px-4 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#141210]"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#EADDCD] px-4 text-sm font-medium text-[#8C7967] opacity-60 dark:border-[#3D3530] dark:text-[#8A7D75]"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          )}
        </div>

        {isExpanded ? (
          <div className="mt-5 rounded-xl border border-[#EADDCD] bg-white p-4 dark:border-[#3D3530] dark:bg-[#1A1814]">
            <h2 className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Full Analysis
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-[#5F524A] dark:text-[#D9C9BD]">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))
              ) : (
                <p>No report text available.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function DashboardSkinAnalysisPage() {
  const [analyses, setAnalyses] = useState<SkinAnalysisHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalyses() {
      try {
        const response = await fetch("/api/client/skin-analysis", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | SkinAnalysisHistoryResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load skin analyses.");
        }

        setAnalyses(data?.analyses ?? []);
        setTotalCount(data?.totalCount ?? 0);
      } catch {
        setError("Your skin analysis history is not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadAnalyses();
  }, []);

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-4 py-10 dark:bg-[#1A1814] sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            My Skin Analysis History
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
            Review your recent AI skin reports and download saved PDFs.
          </p>
        </div>

        {!isLoading && !error ? (
          <div className="rounded-full border border-[#EADDCD] bg-white px-4 py-2 text-sm font-medium text-[#884F38] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#D9C9BD]">
            Total: {totalCount}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && analyses.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-[#EADDCD] bg-white px-6 py-12 text-center dark:border-[#3D3530] dark:bg-[#242220]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D4B47A]/60 bg-[#FFF8E6] text-[#C4A56B] dark:bg-[#33291C]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
            No analyses yet
          </h2>
          <Link
            href="/skin-analysis"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
          >
            Analyze Your Skin
          </Link>
        </div>
      ) : null}

      {!isLoading && !error && analyses.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {analyses.map((analysis) => (
            <AnalysisCard
              key={analysis.id}
              analysis={analysis}
              isExpanded={expandedId === analysis.id}
              onToggle={() =>
                setExpandedId((currentId) =>
                  currentId === analysis.id ? null : analysis.id,
                )
              }
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
