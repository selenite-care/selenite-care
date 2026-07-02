import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BookingStatusControls from "./BookingStatusControls";
import ClientBookingHistory from "@/components/booking/ClientBookingHistory";
import BookingRescheduleControl from "@/components/booking/BookingRescheduleControl";
import DiagnosisEditor from "@/components/diagnosis/DiagnosisEditor";
import RoutineEditor from "@/components/routine/RoutineEditor";
import FeedbackEditor from "@/components/feedback/FeedbackEditor";
import SurveyProfileDetails from "@/components/survey/SurveyProfileDetails";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";

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

export default async function BookingDetailsPage({
  params,
}: BookingDetailsPageProps) {
  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
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
          href="/admin/bookings"
          className="inline-flex h-11 items-center justify-center rounded-md border border-black/10 bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          Back to Bookings
        </Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">
            Client Info
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Name"
              value={
                <span className="inline-flex items-center gap-3">
                  <Avatar
                    imageUrl={booking.user.image}
                    name={booking.user.name}
                    size="sm"
                  />
                  <span>{booking.user.name ?? "Not set"}</span>
                </span>
              }
            />
            <DetailItem label="Email" value={booking.user.email} />
            <DetailItem label="Phone" value={booking.user.phone ?? "Not set"} />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">
            Selected Doctor
          </h2>
          {booking.doctor ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Doctor Name"
                value={booking.doctor?.name ?? "Not assigned"}
              />
              <DetailItem
                label="Designation"
                value={booking.doctor.designation}
              />
              <DetailItem
                label="Availability"
                value={booking.doctor.availability}
              />
              <DetailItem
                label="Bio"
                value={booking.doctor.bio ?? "Not provided"}
              />
            </div>
          ) : (
            <p className="mt-5 text-sm text-foreground/70">
              No doctor has been assigned to this booking.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Appointment</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Booking Token"
              value={booking.token}
            />
            <DetailItem
              label="Preferred Date"
              value={preferredDate}
            />
            <DetailItem
              label="Booking Status"
              value={booking.status}
            />
          </div>
        </section>
      </div>

      <BookingRescheduleControl
        bookingId={booking.id}
        currentAppointmentTime={booking.appointmentTime?.toISOString() ?? null}
        disabled={booking.status === "COMPLETED" || booking.status === "CANCELLED"}
      />

      <div className="mt-6 border-t border-[#EADDCD] pt-6 dark:border-[#3D3530]">
        <ClientBookingHistory
          currentBookingId={booking.id}
          userId={booking.user.id}
          clientName={booking.user.name ?? "Client"}
          clientImage={booking.user.image}
        />
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-foreground">
          Survey Profile Responses
        </h2>
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
          <DiagnosisEditor bookingId={booking.id} canEdit={true} />
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
      <BookingStatusControls bookingId={booking.id} currentStatus={booking.status} />
    </section>
  );
}
