import { notFound } from "next/navigation";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import BookingStatusButtons from "@/components/doctor/BookingStatusButtons";
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

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
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
      user: { select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, surveyProfile: true } },
      service: { select: { id: true, name: true, description: true, price: true } },
      doctor: { select: { id: true, name: true, designation: true, availability: true, bio: true } },
      payment: { select: { id: true, stripePaymentId: true, amount: true, status: true, createdAt: true } },
    },
  });

  if (!booking || booking.doctor?.id !== doctor.id) {
    notFound();
  }

  return (
    <section>
      <div>
        <p className="font-mono text-sm text-foreground/60">{booking.id}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Booking Details</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">Full booking, client, service, and payment information.</p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Client Info</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={booking.user.name ?? "Not set"} />
            <DetailItem label="Email" value={booking.user.email} />
            <DetailItem label="Role" value={booking.user.role} />
            <DetailItem label="Client Since" value={booking.user.createdAt.toLocaleDateString()} />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Service</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={booking.service.name} />
            <DetailItem label="Price" value={formatBdt(booking.service.price)} />
            <DetailItem label="Description" value={booking.service.description ?? "Not provided"} />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Booking Info</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Appointment Creation Time" value={booking.createdAt.toLocaleString()} />
            <DetailItem label="Appointment Taken Time" value={booking.appointmentTime.toLocaleString()} />
            <DetailItem label="Booking Status" value={booking.status} />
            <DetailItem label="Booking Token" value={booking.token} />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Payment Info</h2>
          {booking.payment ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Payment Status" value={booking.payment.status} />
              <DetailItem label="Amount" value={formatBdt(booking.payment.amount)} />
              <DetailItem label="Stripe Payment ID" value={<span className="break-all font-mono text-xs">{booking.payment.stripePaymentId}</span>} />
              <DetailItem label="Paid At" value={booking.payment.createdAt.toLocaleString()} />
            </div>
          ) : (
            <p className="mt-5 text-sm text-foreground/70">No payment record is attached to this booking.</p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-foreground">Selected Doctor</h2>
        {booking.doctor ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={booking.doctor.name} />
            <DetailItem label="Designation" value={booking.doctor.designation} />
            <DetailItem label="Availability" value={booking.doctor.availability} />
            <DetailItem label="Bio" value={booking.doctor.bio ?? "Not provided"} />
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-foreground/70">No doctor has been assigned to this booking.</p>
        )}
      </section>

      <div>
        <BookingStatusButtons bookingId={booking.id} currentStatus={booking.status} />
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-foreground">Skin Profile</h2>
        <SurveyProfileDetails
          profile={booking.user.surveyProfile}
          emptyMessage="No skin profile is available for this client."
        />
      </section>
    </section>
  );
}
