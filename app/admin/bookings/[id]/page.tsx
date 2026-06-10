import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BookingStatusControls from "./BookingStatusControls";
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

  return (
    <section>
      <div>
        <p className="font-mono text-sm text-foreground/60">{booking.token}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Booking Details
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Review the appointment request and the client&apos;s saved skin profile.
        </p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">
            Client Info
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={booking.user.name ?? "Not set"} />
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
              value={booking.appointmentTime?.toLocaleString() ?? "Not scheduled"}
            />
            <DetailItem
              label="Booking Status"
              value={booking.status}
            />
          </div>
        </section>
      </div>

      <BookingStatusControls bookingId={booking.id} currentStatus={booking.status} />

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-foreground">
          Skin Profile
        </h2>
        <SurveyProfileDetails
          profile={booking.user.surveyProfile}
          emptyMessage="No skin profile is available for this client."
        />
      </section>
    </section>
  );
}
