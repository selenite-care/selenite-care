import { FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ReportDownloadButton from "@/components/prescription/ReportDownloadButton";
import { db } from "@/lib/db";
import { formatLongDate } from "@/lib/dateUtils";
import { getClientVisibleBookingWhere } from "@/lib/oneTimeConsultation";

type ClientReport = {
  id: string;
  version: number;
  followUpDate: Date | null;
  sentAt: Date;
  booking: {
    id: string;
    token: string;
    appointmentTime: Date | null;
    createdAt: Date;
    doctor: { name: string } | null;
  };
};

type ReportGroup = {
  booking: ClientReport["booking"];
  reports: ClientReport[];
};

export default async function ClientReportsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/reports");
  }

  const reports = await db.prescription.findMany({
    where: {
      booking: {
        is: {
          userId: session.user.id,
          ...getClientVisibleBookingWhere(),
        },
      },
    },
    select: {
      id: true,
      version: true,
      followUpDate: true,
      sentAt: true,
      booking: {
        select: {
          id: true,
          token: true,
          appointmentTime: true,
          createdAt: true,
          doctor: { select: { name: true } },
        },
      },
    },
    orderBy: { sentAt: "desc" },
  });

  const groupedReports = Array.from(
    reports.reduce((groups, report) => {
      const existing = groups.get(report.booking.id);

      if (existing) {
        existing.reports.push(report);
      } else {
        groups.set(report.booking.id, {
          booking: report.booking,
          reports: [report],
        });
      }

      return groups;
    }, new Map<string, ReportGroup>()),
  ).map(([, group]) => ({
    ...group,
    reports: group.reports.sort((a, b) => b.version - a.version),
  }));

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div>
        <p className="text-xs font-semibold uppercase text-[#B87B68]">
          Consultation Care
        </p>
        <h1
          className="text-page mt-2 text-3xl font-semibold"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          My Consultation Reports
        </h1>
        <p className="text-muted mt-3 max-w-2xl text-sm leading-6">
          View every consultation report and skincare plan shared by your care team.
        </p>
      </div>

      {groupedReports.length === 0 ? (
        <div className="border-themed bg-card mt-8 flex min-h-64 flex-col items-center justify-center rounded-lg border px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B87B68]/15 text-[#B87B68]">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2
            className="text-page mt-5 text-xl font-semibold"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            No consultation reports yet
          </h2>
          <p className="text-muted mt-2 text-sm leading-6">
            Your reports will appear here after your consultation.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {groupedReports.map((group) => {
            const consultationDate =
              group.booking.appointmentTime ?? group.booking.createdAt;
            const latestVersion = Math.max(
              ...group.reports.map((report) => report.version),
            );

            return (
              <article
                key={group.booking.id}
                className="border-themed bg-card overflow-hidden rounded-lg border"
              >
                <header className="border-themed border-b px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-muted text-xs font-semibold uppercase">
                        {formatLongDate(consultationDate)}
                      </p>
                      <h2 className="text-page mt-2 text-lg font-semibold">
                        {group.booking.doctor?.name ?? "Selenite Care Consultant"}
                      </h2>
                    </div>
                    <p className="text-muted font-mono text-xs">
                      {group.booking.token}
                    </p>
                  </div>
                </header>

                <div className="divide-y divide-black/10 dark:divide-white/10">
                  {group.reports.map((report) => {
                    const isLatest = report.version === latestVersion;

                    return (
                      <div
                        key={report.id}
                        className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={
                                isLatest
                                  ? "inline-flex rounded-full bg-[#B87B68] px-3 py-1 text-xs font-semibold text-[#211E1A]"
                                  : "inline-flex rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-foreground/70 dark:border-white/10"
                              }
                            >
                              Version {report.version}
                            </span>
                            {isLatest ? (
                              <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                                Latest version
                              </span>
                            ) : (
                              <span className="text-xs text-foreground/55">
                                Earlier version
                              </span>
                            )}
                          </div>
                          <p className="text-muted mt-2 text-xs leading-5">
                            Sent {formatLongDate(report.sentAt)}
                          </p>
                          {report.followUpDate ? (
                            <p className="mt-1 text-sm font-medium text-[#884F38] dark:text-[#D4A08E]">
                              Follow-up: {formatLongDate(report.followUpDate)}
                            </p>
                          ) : null}
                        </div>

                        <ReportDownloadButton prescriptionId={report.id} />
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
