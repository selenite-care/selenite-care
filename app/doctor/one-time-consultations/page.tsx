"use client";

import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatDateOnly } from "@/lib/dateUtils";

type DoctorConsultation = {
  id: string;
  createdAt: string;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  includesFollowUp: boolean;
  followUpUsed: boolean;
  booking: {
    id: string;
    token: string;
    appointmentTime: string | null;
    user: {
      id: string;
      name: string | null;
      phone: string | null;
      email: string;
    };
  };
};

type ConsultationsResponse = {
  consultations?: DoctorConsultation[];
  error?: string;
};

function paymentBadgeClasses(status: DoctorConsultation["paymentStatus"]) {
  if (status === "PAID") {
    return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300";
  }

  if (status === "REFUNDED") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300";
}

export default function DoctorOneTimeConsultationsPage() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<DoctorConsultation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [openingConversationClientId, setOpeningConversationClientId] =
    useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadConsultations() {
      try {
        setError("");
        const response = await fetch("/api/doctor/one-time-consultations", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => null)) as
          | ConsultationsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load consultations.");
        }

        setConsultations(data?.consultations ?? []);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load consultations.",
        );
        setConsultations([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadConsultations();
    return () => controller.abort();
  }, []);

  const filteredConsultations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return consultations;

    return consultations.filter((consultation) => {
      const client = consultation.booking.user;
      return [client.name, client.phone, client.email, consultation.booking.token]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [consultations, searchQuery]);

  async function openConversation(clientId: string) {
    if (openingConversationClientId) return;

    setActionError("");
    setOpeningConversationClientId(clientId);

    try {
      const response = await fetch("/api/messages/inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId }),
      });
      const data = (await response.json().catch(() => null)) as
        | { conversationId?: string; error?: string }
        | null;

      if (!response.ok || !data?.conversationId) {
        throw new Error(data?.error ?? "Unable to open conversation.");
      }

      router.push(
        `/doctor/messages?conversationId=${encodeURIComponent(data.conversationId)}`,
      );
    } catch (conversationError) {
      setActionError(
        conversationError instanceof Error
          ? conversationError.message
          : "Unable to open conversation.",
      );
      setOpeningConversationClientId("");
    }
  }

  return (
    <section>
      <div>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          One-Time Consultations
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          View direct consultation clients, preferred dates, and follow-up status.
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-black/10 bg-background p-4 dark:border-white/10">
        <label className="block max-w-md">
          <span className="text-sm font-medium text-foreground">
            Search clients
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Name, phone, email, or booking token"
            className="mt-2 h-11 w-full rounded-md border border-black/10 bg-background px-3 text-sm text-foreground outline-none placeholder:text-foreground/50 focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-white/10"
          />
        </label>
        <p className="mt-4 text-sm text-foreground/70">
          Showing {filteredConsultations.length} of {consultations.length} consultations.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6">
          <SkeletonTable rows={6} cols={8} />
        </div>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {actionError ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {actionError}
        </p>
      ) : null}

      {!isLoading && !error ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left text-sm">
              <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Preferred Date</th>
                  <th className="px-4 py-3 font-medium">Booking Token</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Follow-up</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsultations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-foreground/70">
                      No one-time consultations found.
                    </td>
                  </tr>
                ) : (
                  filteredConsultations.map((consultation) => (
                    <tr
                      key={consultation.id}
                      className="border-b border-black/10 last:border-0 dark:border-white/10"
                    >
                      <td className="px-4 py-4 font-medium text-foreground">
                        {consultation.booking.user.name ?? "N/A"}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {consultation.booking.user.phone ? (
                          <a
                            href={`tel:${consultation.booking.user.phone}`}
                            className="inline-flex items-center gap-2 hover:text-[#B87B68]"
                          >
                            <Phone className="h-4 w-4" aria-hidden="true" />
                            {consultation.booking.user.phone}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        <a
                          href={`mailto:${consultation.booking.user.email}`}
                          className="inline-flex items-center gap-2 hover:text-[#B87B68]"
                        >
                          <Mail className="h-4 w-4" aria-hidden="true" />
                          {consultation.booking.user.email}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {formatDateOnly(consultation.booking.appointmentTime)}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-foreground/70">
                        {consultation.booking.token}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${paymentBadgeClasses(consultation.paymentStatus)}`}
                        >
                          {consultation.paymentStatus === "PAID"
                            ? "Confirmed"
                            : consultation.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            consultation.followUpUsed
                              ? "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                              : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300"
                          }`}
                        >
                          {consultation.followUpUsed
                            ? "Used"
                            : consultation.includesFollowUp
                              ? "Available"
                              : "Not included"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void openConversation(
                                consultation.booking.user.id,
                              )
                            }
                            disabled={Boolean(openingConversationClientId)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#B87B68] px-3 text-sm font-medium text-[#884F38] transition-colors hover:bg-[#B87B68]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#D9A694]"
                          >
                            <MessageCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            {openingConversationClientId ===
                            consultation.booking.user.id
                              ? "Opening..."
                              : "Send Message"}
                          </button>
                          <Link
                            href={`/doctor/bookings/${consultation.booking.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                          >
                            View Booking
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
