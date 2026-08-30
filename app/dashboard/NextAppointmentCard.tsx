"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

type ClientBooking = {
  id: string;
  token: string;
  appointmentTime: string | null;
  status: string;
  doctor: {
    name: string;
  } | null;
};

type ClientBookingsResponse = {
  bookings?: ClientBooking[];
};

type NextAppointmentCardProps = {
  hasActiveMembership: boolean;
};

function getDaysUntil(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointmentDate = new Date(date);
  appointmentDate.setHours(0, 0, 0, 0);

  return Math.ceil(
    (appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getCountdownLabel(daysUntil: number) {
  if (daysUntil <= 0) {
    return "Today";
  }

  if (daysUntil === 1) {
    return "Tomorrow";
  }

  return `In ${daysUntil} days`;
}

export default function NextAppointmentCard({
  hasActiveMembership,
}: NextAppointmentCardProps) {
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

  const nextAppointment = useMemo(() => {
    const now = new Date();

    return bookings
      .filter((booking) => {
        if (!booking.appointmentTime) {
          return false;
        }

        const appointmentTime = new Date(booking.appointmentTime);

        return (
          ["PENDING", "CONFIRMED"].includes(booking.status) &&
          appointmentTime.getTime() > now.getTime()
        );
      })
      .sort(
        (first, second) =>
          new Date(first.appointmentTime ?? 0).getTime() -
          new Date(second.appointmentTime ?? 0).getTime(),
      )[0];
  }, [bookings]);

  if (isLoading) {
    return (
      <article className="bg-card border-themed rounded-lg border border-l-4 border-l-[var(--gold)] p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-[#EADDCD] dark:bg-[#3D3530]" />
        <div className="mt-4 h-8 w-56 animate-pulse rounded bg-[#EADDCD] dark:bg-[#3D3530]" />
      </article>
    );
  }

  if (!nextAppointment?.appointmentTime) {
    return (
      <article className="bg-card border-themed rounded-lg border border-l-4 border-l-[var(--gold)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B87B68]/15 text-[#B87B68] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-page text-lg font-semibold">
                No upcoming appointment
              </p>
              <p className="text-muted mt-2 text-sm leading-6">
                Book your next consultation.
              </p>
            </div>
          </div>

          <Link
            href={hasActiveMembership ? "/appointment" : "/services"}
            className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--sidebar)] px-5 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
          >
            Book Now
          </Link>
        </div>
      </article>
    );
  }

  const appointmentDate = new Date(nextAppointment.appointmentTime);
  const daysUntil = getDaysUntil(appointmentDate);
  const isUrgent = daysUntil <= 3;

  return (
    <article
      className={`bg-card rounded-lg border border-l-4 p-6 ${
        isUrgent
          ? "border-[#B87B68] border-l-[#B87B68] shadow-[0_14px_35px_rgba(184,123,104,0.14)]"
          : "border-themed border-l-[var(--gold)]"
      }`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#B87B68]/15 text-[#B87B68] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
            <CalendarDays className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-muted text-sm font-medium">
              Your Next Appointment
            </p>
            <p className="mt-2 font-mono text-sm font-semibold text-[#B87B68] dark:text-[#D4B47A]">
              {nextAppointment.token}
            </p>
            <h2
              className="text-page mt-3 text-2xl font-semibold"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {nextAppointment.doctor?.name ?? "Doctor to be assigned"}
            </h2>
            <p className="text-muted mt-2 text-sm leading-6">
              {formatDate(appointmentDate)}
            </p>
          </div>
        </div>

        <div className="inline-flex w-fit rounded-full bg-[#B87B68]/15 px-4 py-2 text-sm font-semibold text-[#8A6A2F] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A] sm:mt-1">
          {getCountdownLabel(daysUntil)}
        </div>
      </div>
    </article>
  );
}
