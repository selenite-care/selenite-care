"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Sparkles,
  Star,
  Stethoscope,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

type JourneyEntry = {
  id: string;
  token: string;
  status: string;
  appointmentTime: string | null;
  createdAt: string;
  doctor: {
    name: string;
    designation: string;
  } | null;
  surveyResponse: {
    skinType: string | null;
    skinIssues: string[];
    skinImages: string[];
    currentProductsImage: string | null;
    previousConsultation: boolean | null;
  } | null;
  diagnosis: {
    problemIdentification: string | null;
    recommendations: {
      product: {
        name: string;
        image: string | null;
      };
    }[];
  } | null;
  routineGuideline: {
    content: string | null;
  } | null;
  customerFeedback: {
    feedback: string | null;
    images: string[];
  } | null;
};

type JourneyResponse = {
  bookings?: JourneyEntry[];
  error?: string;
};

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300";
    case "CONFIRMED":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300";
    case "CANCELLED":
      return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300";
    case "PENDING":
    default:
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
  }
}

function getDateMarker(date: string | null) {
  const parsedDate = date ? new Date(date) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-BD", {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

export default function SkinJourneyPage() {
  const [journeyEntries, setJourneyEntries] = useState<JourneyEntry[]>([]);
  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadJourney() {
      try {
        const response = await fetch("/api/client/journey", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | JourneyResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load your journey.");
        }

        if (isMounted) {
          setJourneyEntries(data?.bookings ?? []);
          setError("");
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your journey.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadJourney();

    return () => {
      isMounted = false;
    };
  }, []);

  const entriesNewestFirst = useMemo(
    () => [...journeyEntries].reverse(),
    [journeyEntries],
  );

  function toggleRoutine(entryId: string) {
    setExpandedRoutineIds((current) => {
      const next = new Set(current);

      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }

      return next;
    });
  }

  return (
    <section className="pb-24 md:pb-6">
      <div className="mb-8">
        <h1
          className="text-4xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          My Skin Journey
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#884F38] dark:text-[#8A7D75]">
          Your personal skincare story with Selenite Care — track your progress
          and transformation.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
          <div className="h-5 w-48 animate-pulse rounded bg-[#EADDCD] dark:bg-[#3D3530]" />
          <div className="mt-4 h-20 animate-pulse rounded bg-[#F8F5F0] dark:bg-[#1A1814]" />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && entriesNewestFirst.length === 0 ? (
        <div className="rounded-2xl border border-[#EADDCD] bg-white px-6 py-12 text-center dark:border-[#3D3530] dark:bg-[#242220]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#B87B68]/15 text-[#B87B68] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
            <Sparkles className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
            Your skin journey begins with your first consultation. Book an
            appointment to start your transformation story.
          </p>
          <Link
            href="/services"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[var(--sidebar)] px-5 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
          >
            Start My Journey
          </Link>
        </div>
      ) : null}

      {!isLoading && !error && entriesNewestFirst.length > 0 ? (
        <div className="relative space-y-8 pl-14 sm:pl-20">
          <div className="absolute bottom-0 left-6 top-2 w-px bg-[#B87B68]/45 sm:left-9" />

          {entriesNewestFirst.map((entry) => {
            const chapterDate = entry.appointmentTime ?? entry.createdAt;
            const routineContent = entry.routineGuideline?.content ?? "";
            const isRoutineExpanded = expandedRoutineIds.has(entry.id);
            const routinePreview = isRoutineExpanded
              ? routineContent
              : truncateText(routineContent, 100);

            return (
              <article key={entry.id} className="relative">
                <div className="absolute -left-14 top-2 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#F8F5F0] bg-[#B87B68] text-center text-[11px] font-bold leading-tight text-[#F8F5F0] shadow-lg dark:border-[#141210] dark:bg-[#D4B47A] dark:text-[#141210] sm:-left-20 sm:h-16 sm:w-16 sm:text-xs">
                  {getDateMarker(chapterDate)}
                </div>

                <div className="rounded-2xl border border-[#EADDCD] bg-white p-5 shadow-sm dark:border-[#3D3530] dark:bg-[#242220] sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-mono text-sm font-semibold text-[#B87B68] dark:text-[#D4B47A]">
                        Consultation #{entry.token}
                      </p>
                      <h2
                        className="mt-2 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        {entry.doctor?.name ?? "Doctor to be assigned"}
                      </h2>
                      <p className="mt-1 text-sm text-[#884F38] dark:text-[#8A7D75]">
                        {entry.doctor?.designation ?? "Selenite Care"} ·{" "}
                        {formatDate(chapterDate)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${getStatusBadgeClasses(
                        entry.status,
                      )}`}
                    >
                      {entry.status}
                    </span>
                  </div>

                  {entry.surveyResponse ? (
                    <div className="mt-6 border-t border-[#EADDCD] pt-5 dark:border-[#3D3530]">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#884F38] dark:text-[#8A7D75]">
                        Skin Concern
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entry.surveyResponse.skinType ? (
                          <span className="rounded-full bg-[#B87B68]/15 px-3 py-1 text-xs font-semibold text-[#8A6A2F] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
                            {entry.surveyResponse.skinType}
                          </span>
                        ) : null}
                        {entry.surveyResponse.skinIssues.map((issue) => (
                          <span
                            key={issue}
                            className="rounded-full bg-[#F8F5F0] px-3 py-1 text-xs font-medium text-[#6E6257] dark:bg-[#1A1814] dark:text-[#8A7D75]"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {entry.surveyResponse?.skinImages.length ? (
                    <div className="mt-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#884F38] dark:text-[#8A7D75]">
                        Skin Photos
                      </p>
                      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                        {entry.surveyResponse.skinImages.map((imageUrl) => (
                          <button
                            key={imageUrl}
                            type="button"
                            onClick={() => setSelectedImage(imageUrl)}
                            className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#EADDCD] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814]"
                          >
                            <img
                              src={imageUrl}
                              alt="Skin photo"
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {entry.diagnosis ? (
                    <div className="mt-6 rounded-2xl bg-[#F8F5F0] p-4 dark:bg-[#1A1814]">
                      <div className="flex items-start gap-3">
                        <Stethoscope
                          className="mt-0.5 h-5 w-5 shrink-0 text-[#B87B68] dark:text-[#D4B47A]"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                            Doctor's Assessment
                          </p>
                          {entry.diagnosis.problemIdentification ? (
                            <p className="mt-2 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                              {entry.diagnosis.problemIdentification}
                            </p>
                          ) : null}
                          <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8A6A2F] dark:bg-[#242220] dark:text-[#D4B47A]">
                            {entry.diagnosis.recommendations.length} products
                            recommended
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {routineContent ? (
                    <div className="mt-6 rounded-2xl border border-[#EADDCD] p-4 dark:border-[#3D3530]">
                      <div className="flex items-start gap-3">
                        <ClipboardList
                          className="mt-0.5 h-5 w-5 shrink-0 text-[#B87B68] dark:text-[#D4B47A]"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                            Your Routine
                          </p>
                          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                            {routinePreview}
                          </p>
                          {routineContent.length > 100 ? (
                            <button
                              type="button"
                              onClick={() => toggleRoutine(entry.id)}
                              className="mt-3 text-sm font-semibold text-[#B87B68] transition-opacity hover:opacity-80 dark:text-[#D4B47A]"
                            >
                              {isRoutineExpanded
                                ? "Show Less"
                                : "Read Full Routine"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {entry.customerFeedback ? (
                    <div className="mt-6 rounded-2xl bg-[#B87B68]/10 p-4 dark:bg-[#D4B47A]/10">
                      <div className="flex items-start gap-3">
                        <Star
                          className="mt-0.5 h-5 w-5 shrink-0 fill-[#B87B68] text-[#B87B68] dark:fill-[#D4B47A] dark:text-[#D4B47A]"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                            Your Feedback
                          </p>
                          {entry.customerFeedback.feedback ? (
                            <p className="mt-2 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                              {entry.customerFeedback.feedback}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {entry.customerFeedback.images.length ? (
                        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                          {entry.customerFeedback.images.map((imageUrl) => (
                            <button
                              key={imageUrl}
                              type="button"
                              onClick={() => setSelectedImage(imageUrl)}
                              className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#EADDCD] bg-white dark:border-[#3D3530] dark:bg-[#1A1814]"
                            >
                              <img
                                src={imageUrl}
                                alt="Feedback image"
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-6 border-t border-[#EADDCD] pt-4 dark:border-[#3D3530]">
                    <Link
                      href={`/dashboard/bookings/${entry.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--sidebar)] px-4 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
                    >
                      View Full Details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {selectedImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl">
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2B2B2B] shadow-lg transition-colors hover:bg-[#F8F5F0]"
              aria-label="Close image"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <img
              src={selectedImage}
              alt="Full size journey image"
              className="max-h-[90vh] w-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
