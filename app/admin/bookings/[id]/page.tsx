import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BookingStatusControls from "./BookingStatusControls";
import PaymentStatusControls from "./PaymentStatusControls";
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

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
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
          role: true,
          createdAt: true,
          surveyProfile: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
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
      payment: {
        select: {
          id: true,
          stripePaymentId: true,
          amount: true,
          status: true,
          createdAt: true,
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
        <p className="font-mono text-sm text-foreground/60">{booking.id}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Booking Details
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Full booking, client, service, and payment information.
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
            <DetailItem label="Role" value={booking.user.role} />
            <DetailItem
              label="Client Since"
              value={booking.user.createdAt.toLocaleDateString()}
            />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Service</h2>
          {booking.service ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Name" value={booking.service?.name ?? "N/A"} />
              <DetailItem
                label="Price"
                value={formatBdt(booking.service?.price ?? 0)}
              />
              <DetailItem
                label="Description"
                value={booking.service.description ?? "Not provided"}
              />
            </div>
          ) : (
            <p className="mt-5 text-sm text-foreground/70">
              No service record is attached to this booking.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">
            Booking Info
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Appointment Taken Time"
              value={booking.appointmentTime?.toLocaleString() ?? "Not scheduled"}
            />
            <DetailItem label="Booking Status" value={booking.status} />
            <DetailItem
              label="Appointment Creation Time"
              value={booking.createdAt.toLocaleString()}
            />
            <DetailItem label="Booking Token" value={booking.token} />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">
            Payment Info
          </h2>
          {booking.payment ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Payment Status" value={booking.payment?.status ?? "UNPAID"} />
              <DetailItem
                label="Amount"
                value={formatBdt(booking.payment?.amount ?? 0)}
              />
              <DetailItem
                label="Stripe Payment ID"
                value={
                  <span className="break-all font-mono text-xs">
                    {booking.payment.stripePaymentId}
                  </span>
                }
              />
              <DetailItem
                label="Paid At"
                value={booking.payment.createdAt.toLocaleString()}
              />
            </div>
          ) : (
            <p className="mt-5 text-sm text-foreground/70">
              No payment record is attached to this booking.
            </p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-foreground">
          Selected Doctor
        </h2>
        {booking.doctor ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={booking.doctor?.name ?? "Not assigned"} />
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
          <p className="mt-4 text-sm leading-6 text-foreground/70">
            No doctor has been assigned to this booking.
          </p>
        )}
      </section>

      <BookingStatusControls bookingId={booking.id} currentStatus={booking.status} />

      {booking.payment ? (
        <PaymentStatusControls
          paymentId={booking.payment.id}
          currentStatus={booking.payment?.status ?? "UNPAID"}
        />
      ) : null}

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
