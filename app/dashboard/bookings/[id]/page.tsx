import Link from "next/link";
import NextAuth from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
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
          designation: true,
          availability: true,
          bio: true,
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

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-sm text-foreground/60">{booking.token}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Booking Details
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Review your appointment details and saved skin profile.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/dashboard/bookings"
            className="inline-flex h-11 items-center justify-center rounded-md border border-black/10 bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            Back to Bookings
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Appointment</h2>
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
              label="Designation"
              value={booking.doctor?.designation ?? "Not provided"}
            />
            <DetailItem
              label="Preferred Date"
              value={booking.appointmentTime?.toLocaleString() ?? "Not scheduled"}
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
            <DetailItem
              label="Availability"
              value={booking.doctor?.availability ?? "Not provided"}
            />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Doctor Notes</h2>
          <div className="mt-5">
            <DetailItem
              label="Bio"
              value={booking.doctor?.bio ?? "Doctor profile is not available."}
            />
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-foreground">
          Survey Profile Responses
        </h2>
        <SurveyProfileDetails
          profile={booking.user.surveyProfile}
          emptyMessage="No survey profile is available for your account."
        />
      </section>

      <section className="mt-6 rounded-lg border border-black/10 bg-blue-50 p-6 dark:border-white/10 dark:bg-blue-950/20">
        <p className="text-sm text-foreground/80">
          To cancel or reschedule your appointment, please contact us at{" "}
          <a
            href="mailto:careseleniteit@gmail.com"
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            careseleniteit@gmail.com
          </a>{" "}
          or reach out via our Facebook page.
        </p>
      </section>
    </section>
  );
}
