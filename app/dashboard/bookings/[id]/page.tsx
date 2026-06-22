import Link from "next/link";
import NextAuth from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import DiagnosisEditor from "@/components/diagnosis/DiagnosisEditor";
import RoutineEditor from "@/components/routine/RoutineEditor";
import FeedbackEditor from "@/components/feedback/FeedbackEditor";
import SurveyProfileDetails from "@/components/survey/SurveyProfileDetails";

type BookingDetailsPageProps = {
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
      <p className="text-muted text-sm font-medium">{label}</p>
      <div className="text-page mt-1 text-sm">{value}</div>
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

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const { id } = await params
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const booking = await db.booking.findFirst({
    where: {
      id: id,
      userId: session.user?.id,
    },
    include: {
      doctor: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          surveyProfile: true,
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
          <p className="text-muted font-mono text-sm">{booking.token}</p>
          <h1
            className="text-page mt-2 text-3xl font-semibold tracking-tight"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Booking Details
          </h1>
          <p className="text-muted mt-3 text-sm leading-6">
            Review your appointment details and your saved skin profile.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/dashboard/bookings"
            className="border-themed bg-card text-page inline-flex h-11 items-center justify-center rounded-md border px-5 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            Back to Bookings
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="bg-card border-themed rounded-lg border p-6">
          <h2
            className="text-page text-lg font-semibold"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Appointment
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Booking Token"
              value={booking.token}
            />
            <DetailItem
              label="Doctor Name"
              value={booking.doctor?.name ?? "Not assigned"}
            />
            <DetailItem
              label="Preferred Date"
              value={preferredDate}
            />
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

      <section className="bg-card border-themed mt-6 rounded-lg border p-6">
        <h2
          className="text-page text-lg font-semibold"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Survey Profile Summary
        </h2>
        <SurveyProfileDetails
          profile={booking.user.surveyProfile}
          emptyMessage="No survey profile is available for your account."
        />
      </section>

      <section className="bg-card border-themed mt-6 rounded-lg border p-6">
        <h2
          className="text-page text-2xl font-semibold"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Diagnosis
        </h2>
        <div className="mt-5">
          <DiagnosisEditor bookingId={booking.id} canEdit={false} />
        </div>
      </section>

      <section className="bg-card border-themed mt-6 rounded-lg border p-6">
        <h2
          className="text-page text-2xl font-semibold"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Routine &amp; Guidelines
        </h2>
        <div className="mt-5">
          <RoutineEditor bookingId={booking.id} canEdit={false} />
        </div>
      </section>

      <section className="bg-card border-themed mt-6 rounded-lg border p-6">
        <h2
          className="text-page text-2xl font-semibold"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Customer&apos;s Feedback
        </h2>
        <div className="mt-5">
          <FeedbackEditor bookingId={booking.id} canEdit={true} />
        </div>
      </section>
    </section>
  );
}
