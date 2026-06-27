import Link from "next/link";
import NextAuth from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import BookingStatusButtons from "./BookingStatusButtons";
import ClientBookingHistory from "@/components/booking/ClientBookingHistory";
import BookingRescheduleControl from "@/components/booking/BookingRescheduleControl";
import DiagnosisEditor from "@/components/diagnosis/DiagnosisEditor";
import RoutineEditor from "@/components/routine/RoutineEditor";
import FeedbackEditor from "@/components/feedback/FeedbackEditor";
import SurveyProfileDetails from "@/components/survey/SurveyProfileDetails";

type CrmBookingDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground/60">{label}</p>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}

const { auth } = NextAuth(authConfig);

function getBookingStatusBadgeClasses(status: string) {
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

export default async function CrmBookingDetailsPage({
  params,
}: CrmBookingDetailsPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "CRM") {
    redirect("/dashboard");
  }

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          surveyProfile: true,
        },
      },
      doctor: {
        select: {
          id: true,
          name: true,
          designation: true,
          availability: true,
          bio: true,
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const preferredDate = booking.appointmentTime
    ? new Date(booking.appointmentTime).toLocaleDateString()
    : "Not scheduled";

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-sm text-foreground/60">{booking.token}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Booking Details
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Review the appointment request and the client&apos;s latest skin profile.
          </p>
        </div>

        <Link
          href="/crm/bookings"
          className="inline-flex h-11 items-center justify-center rounded-md border border-black/10 bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          Back to Bookings
        </Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Client Info</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={booking.user.name ?? "Not set"} />
            <DetailItem label="Email" value={booking.user.email} />
            <DetailItem label="Phone" value={booking.user.phone ?? "Not set"} />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Doctor</h2>
          {booking.doctor ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Doctor Name" value={booking.doctor?.name ?? "Not assigned"} />
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-foreground/70">
              No doctor has been assigned to this booking.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Appointment</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Booking Token" value={booking.token} />
            <DetailItem label="Preferred Date" value={preferredDate} />
            <DetailItem
              label="Booking Status"
              value={
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getBookingStatusBadgeClasses(
                    booking.status,
                  )}`}
                >
                  {booking.status}
                </span>
              }
            />
          </div>
        </section>
      </div>

      <BookingRescheduleControl
        bookingId={booking.id}
        currentAppointmentTime={booking.appointmentTime?.toISOString() ?? null}
        disabled={booking.status === "COMPLETED" || booking.status === "CANCELLED"}
      />

      <BookingStatusButtons bookingId={booking.id} currentStatus={booking.status} />

      <div className="mt-6 border-t border-[#D8C7B5] pt-6 dark:border-[#3D3530]">
        <ClientBookingHistory
          currentBookingId={booking.id}
          userId={booking.user.id}
          clientName={booking.user.name ?? "Client"}
        />
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-foreground">Survey Profile Responses</h2>
        <SurveyProfileDetails
          profile={booking.user.surveyProfile}
          emptyMessage="No skin profile is available for this client."
        />
      </section>

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Diagnosis
        </h2>
        <div className="mt-5">
          <DiagnosisEditor bookingId={booking.id} canEdit={false} />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Routine &amp; Guidelines
        </h2>
        <div className="mt-5">
          <RoutineEditor bookingId={booking.id} canEdit={true} />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Customer&apos;s Feedback
        </h2>
        <div className="mt-5">
          <FeedbackEditor bookingId={booking.id} canEdit={false} />
        </div>
      </section>
    </section>
  );
}
