import { notFound } from "next/navigation";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import BookingStatusButtons from "@/components/doctor/BookingStatusButtons";
import ClientBookingHistory from "@/components/booking/ClientBookingHistory";
import DiagnosisEditor from "@/components/diagnosis/DiagnosisEditor";
import RoutineEditor from "@/components/routine/RoutineEditor";
import FeedbackEditor from "@/components/feedback/FeedbackEditor";
import SurveyProfileDetails from "@/components/survey/SurveyProfileDetails";

const { auth } = NextAuth(authConfig);

type BookingDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground/60">{label}</p>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") {
    notFound();
  }

  const userName = session.user.name?.trim() ?? "";

  let doctor = null;
  if (userName) {
    doctor = await db.doctor.findFirst({ where: { name: userName }, select: { id: true } });
    if (!doctor && !userName.toLowerCase().startsWith("dr.")) {
      doctor = await db.doctor.findFirst({ where: { name: `Dr. ${userName}` }, select: { id: true } });
    }
  }

  if (!doctor) {
    notFound();
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
          role: true,
          createdAt: true,
        },
      },
      doctor: { select: { id: true, name: true, designation: true, availability: true, bio: true } },
    },
  });

  if (!booking || booking.doctor?.id !== doctor.id) {
    notFound();
  }

  const surveyProfile = await db.surveyProfile.findUnique({
    where: {
      userId: booking.user.id,
    },
  });

  const preferredDate = booking.appointmentTime
    ? new Date(booking.appointmentTime).toLocaleDateString()
    : "Not scheduled";

  return (
    <section>
      <div>
        <p className="font-mono text-sm text-foreground/60">{booking.token}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Booking Details</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">Review the client appointment request and their latest skin profile.</p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Client Info</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={booking.user.name ?? "Not set"} />
            <DetailItem label="Email" value={booking.user.email} />
            <DetailItem label="Phone" value={booking.user.phone ?? "Not set"} />
            <DetailItem label="Client Since" value={booking.user.createdAt.toLocaleDateString()} />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Appointment</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Booking Token" value={booking.token} />
            <DetailItem label="Preferred Date" value={preferredDate} />
            <DetailItem label="Booking Status" value={booking.status} />
            <DetailItem label="Created At" value={booking.createdAt.toLocaleString()} />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Selected Doctor</h2>
          {booking.doctor ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Doctor Name" value={booking.doctor?.name ?? "Not assigned"} />
              <DetailItem label="Designation" value={booking.doctor.designation} />
              <DetailItem label="Availability" value={booking.doctor.availability} />
              <DetailItem label="Bio" value={booking.doctor.bio ?? "Not provided"} />
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-foreground/70">No doctor has been assigned to this booking.</p>
          )}
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Status</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Booking Status" value={booking.status} />
            <DetailItem label="Preferred Date" value={preferredDate} />
          </div>
        </section>
      </div>

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
          profile={surveyProfile}
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
      <div>
        <BookingStatusButtons bookingId={booking.id} currentStatus={booking.status} />
      </div>
    </section>
  );
}
