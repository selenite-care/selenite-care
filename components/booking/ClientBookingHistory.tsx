"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Star, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ClientBookingHistoryProps = {
  currentBookingId: string;
  userId: string;
  clientName: string;
};

type BookingHistoryItem = {
  id: string;
  token: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  appointmentTime: string | null;
  createdAt: string;
  doctorName: string | null;
  hasDiagnosis: boolean;
  hasRoutine: boolean;
  hasFeedback: boolean;
};

type BookingHistoryResponse = {
  bookings?: BookingHistoryItem[];
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return date.toLocaleDateString();
}

function getStatusBadgeClasses(status: BookingHistoryItem["status"]) {
  switch (status) {
    case "PENDING":
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-300";
    case "CONFIRMED":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300";
    case "COMPLETED":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300";
    default:
      return "border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5";
  }
}

export default function ClientBookingHistory({
  currentBookingId,
  userId,
  clientName,
}: ClientBookingHistoryProps) {
  const pathname = usePathname();
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadBookingHistory() {
      try {
        const response = await fetch(`/api/admin/clients/${userId}/bookings`, {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | BookingHistoryResponse
          | null;

        if (!response.ok || !data?.bookings) {
          return;
        }

        if (!isMounted) {
          return;
        }

        setBookings(data.bookings);
      } catch {
        if (!isMounted) {
          return;
        }

        setBookings([]);
      }
    }

    void loadBookingHistory();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const otherBookings = useMemo(
    () => bookings.filter((booking) => booking.id !== currentBookingId),
    [bookings, currentBookingId],
  );

  const basePath = useMemo(() => {
    if (!pathname) {
      return "";
    }

    return pathname.replace(/\/[^/]+$/, "");
  }, [pathname]);

  if (otherBookings.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-lg border border-[#D8C7B5] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Other Bookings by {clientName}
          </h2>
          <p className="mt-2 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
            Click to switch booking view.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {otherBookings.map((booking, index) => (
          <Link
            key={booking.id}
            href={`${basePath}/${booking.id}`}
            className={`rounded-xl border bg-[#F8F5F0] p-4 transition-colors hover:bg-[#F2EADF] dark:border-[#3D3530] dark:bg-[#1A1814] dark:hover:bg-[#221F1C] ${
              index === 0
                ? "border-[#D8C7B5] border-l-4 border-l-[#C6A56B]"
                : "border-[#D8C7B5]"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-[#C6A56B]">
                  {booking.token}
                </p>
                <p className="mt-2 text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {booking.doctorName ?? "Doctor not assigned"}
                </p>
                <p className="mt-1 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
                  {formatDate(booking.appointmentTime)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                    booking.status,
                  )}`}
                >
                  {booking.status}
                </span>

                <div className="flex items-center gap-1.5 text-[#B8A89A] dark:text-[#8A7D75]">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                      booking.hasDiagnosis
                        ? "border-[#D8C7B5] bg-[#FFF8EE] text-[#C6A56B] dark:border-[#3D3530] dark:bg-[#2A241D] dark:text-[#D4B47A]"
                        : "border-[#E7DDD1] bg-white/70 text-[#CFC5BA] dark:border-[#3D3530] dark:bg-[#201D1A] dark:text-[#5E544D]"
                    }`}
                    title={
                      booking.hasDiagnosis
                        ? "Diagnosis available"
                        : "No diagnosis yet"
                    }
                  >
                    <Stethoscope className="h-4 w-4" />
                  </span>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                      booking.hasRoutine
                        ? "border-[#D8C7B5] bg-[#FFF8EE] text-[#C6A56B] dark:border-[#3D3530] dark:bg-[#2A241D] dark:text-[#D4B47A]"
                        : "border-[#E7DDD1] bg-white/70 text-[#CFC5BA] dark:border-[#3D3530] dark:bg-[#201D1A] dark:text-[#5E544D]"
                    }`}
                    title={
                      booking.hasRoutine
                        ? "Routine available"
                        : "No routine yet"
                    }
                  >
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                      booking.hasFeedback
                        ? "border-[#D8C7B5] bg-[#FFF8EE] text-[#C6A56B] dark:border-[#3D3530] dark:bg-[#2A241D] dark:text-[#D4B47A]"
                        : "border-[#E7DDD1] bg-white/70 text-[#CFC5BA] dark:border-[#3D3530] dark:bg-[#201D1A] dark:text-[#5E544D]"
                    }`}
                    title={
                      booking.hasFeedback
                        ? "Feedback available"
                        : "No feedback yet"
                    }
                  >
                    <Star className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
