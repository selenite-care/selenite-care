import { notFound } from "next/navigation";
import { db } from "@/lib/db";

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
          role: true,
          createdAt: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          price: true,
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
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={booking.service.name} />
            <DetailItem
              label="Duration"
              value={`${booking.service.duration} minutes`}
            />
            <DetailItem
              label="Price"
              value={`$${booking.service.price.toFixed(2)}`}
            />
            <DetailItem
              label="Description"
              value={booking.service.description ?? "Not provided"}
            />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">
            Booking Info
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Appointment Time"
              value={booking.appointmentTime.toLocaleString()}
            />
            <DetailItem label="Booking Status" value={booking.status} />
            <DetailItem
              label="Created"
              value={booking.createdAt.toLocaleString()}
            />
            <DetailItem label="Booking Token" value={booking.id} />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">
            Payment Info
          </h2>
          {booking.payment ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Payment Status" value={booking.payment.status} />
              <DetailItem
                label="Amount"
                value={`$${booking.payment.amount.toFixed(2)}`}
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
          Survey Form Responses
        </h2>
        <p className="mt-4 text-sm leading-6 text-foreground/70">
          Survey responses are not available yet because the current database
          schema does not include fields or a related table for storing the
          consultation form answers.
        </p>
      </section>
    </section>
  );
}
