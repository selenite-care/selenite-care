"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Stethoscope } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

type ClientBooking = {
  id: string;
  appointmentTime: string | null;
  createdAt: string;
  status: string;
  doctor: {
    name: string;
  } | null;
  diagnosis: {
    problemIdentification: string | null;
    recommendations: {
      productId: string;
    }[];
  } | null;
};

type ClientBookingsResponse = {
  bookings?: ClientBooking[];
};

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

export default function LatestSkinAssessmentCard() {
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadBookings() {
      try {
        const response = await fetch("/api/client/bookings", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | ClientBookingsResponse
          | null;

        if (!response.ok || !isMounted) {
          return;
        }

        setBookings(data?.bookings ?? []);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const latestAssessment = useMemo(
    () =>
      bookings.find(
        (booking) => booking.status === "COMPLETED" && Boolean(booking.diagnosis),
      ),
    [bookings],
  );

  if (isLoading) {
    return (
      <article className="bg-card border-themed rounded-lg border border-l-4 border-l-[var(--gold)] p-6">
        <div className="h-5 w-44 animate-pulse rounded bg-[#EADDCD] dark:bg-[#3D3530]" />
        <div className="mt-4 h-8 w-64 animate-pulse rounded bg-[#EADDCD] dark:bg-[#3D3530]" />
      </article>
    );
  }

  if (!latestAssessment?.diagnosis) {
    return (
      <article className="bg-card border-themed rounded-lg border border-l-4 border-l-[var(--gold)] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B87B68]/15 text-[#B87B68] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
            <Stethoscope className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-page text-lg font-semibold">
              Latest Skin Assessment
            </p>
            <p className="text-muted mt-2 text-sm leading-6">
              Your doctor's assessment will appear here after your first
              consultation.
            </p>
          </div>
        </div>
      </article>
    );
  }

  const assessmentDate =
    latestAssessment.appointmentTime ?? latestAssessment.createdAt;
  const recommendedCount = latestAssessment.diagnosis.recommendations.length;
  const recommendationLabel =
    recommendedCount === 1
      ? "1 product recommended"
      : `${recommendedCount} products recommended`;

  return (
    <article className="bg-card border-themed rounded-lg border border-l-4 border-l-[var(--gold)] p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#B87B68]/15 text-[#B87B68] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
            <Stethoscope className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-muted text-sm font-medium">
              Latest Skin Assessment
            </p>
            <h2
              className="text-page mt-3 text-2xl font-semibold"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {latestAssessment.doctor?.name ?? "Selenite Care Doctor"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
              {formatDate(assessmentDate)}
            </p>
            {latestAssessment.diagnosis.problemIdentification ? (
              <p className="text-muted mt-4 max-w-3xl text-sm leading-7">
                {truncateText(
                  latestAssessment.diagnosis.problemIdentification,
                  120,
                )}
              </p>
            ) : null}
            <div className="mt-4 inline-flex rounded-full bg-[#B87B68]/15 px-3 py-1 text-xs font-semibold text-[#8A6A2F] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
              {recommendationLabel}
            </div>
          </div>
        </div>

        <Link
          href={`/dashboard/bookings/${latestAssessment.id}`}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-[var(--sidebar)] px-5 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
        >
          View Full Report
        </Link>
      </div>
    </article>
  );
}
