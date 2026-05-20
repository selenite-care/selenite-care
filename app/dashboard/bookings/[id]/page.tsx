import Link from "next/link";
import NextAuth from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

type BookingDetailsPageProps = {
  params: {
    id: string;
  };
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

function joinValues(values?: string[]) {
  if (!values || values.length === 0) {
    return "None";
  }

  return values.join(", ");
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const booking = await db.booking.findFirst({
    where: {
      id: params?.id,
      userId: session.user?.id,
    },
    include: {
      service: {
        select: {
          name: true,
          description: true,
          duration: true,
          price: true,
        },
      },
      payment: {
        select: {
          stripePaymentId: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
      surveyResponse: true,
    },
  });

  if (!booking) {
    notFound();
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-sm text-foreground/60">{booking.id}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Booking Details
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Review your appointment, payment status, and submitted survey answers.
          </p>
        </div>

        <Link
          href="/dashboard/bookings"
          className="inline-flex h-11 items-center justify-center rounded-md border border-black/10 bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          Back to Bookings
        </Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Service</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Service Name" value={booking.service.name} />
            <DetailItem
              label="Appointment Time"
              value={booking.appointmentTime.toLocaleString()}
            />
            <DetailItem label="Booking Token" value={booking.id} />
            <DetailItem label="Status" value={booking.status} />
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
              value={booking.service.description ?? "No description"}
            />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Payment Info</h2>
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
              No payment record is attached to this booking yet.
            </p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-foreground">
          Survey Form Responses
        </h2>
        {booking.surveyResponse ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={booking.surveyResponse.name} />
            <DetailItem label="Age" value={booking.surveyResponse.age} />
            <DetailItem label="Phone" value={booking.surveyResponse.phone} />
            <DetailItem label="Email" value={booking.surveyResponse.email} />
            <DetailItem label="Skin Type" value={booking.surveyResponse.skinType} />
            <DetailItem
              label="Code ID"
              value={booking.surveyResponse.codeId}
            />
            <DetailItem
              label="Uses Korean Products"
              value={booking.surveyResponse.usesKoreanProducts ? "Yes" : "No"}
            />
            <DetailItem
              label="Facing Skin Issues"
              value={booking.surveyResponse.facingSkinIssues ? "Yes" : "No"}
            />
            <DetailItem
              label="Skin Issues"
              value={joinValues(booking.surveyResponse.skinIssues)}
            />
            <DetailItem
              label="Issue Duration"
              value={booking.surveyResponse.skinIssueDuration ?? "Not specified"}
            />
            <DetailItem
              label="Current Products"
              value={joinValues(booking.surveyResponse.currentProducts)}
            />
            <DetailItem
              label="Allergic Ingredients"
              value={joinValues(booking.surveyResponse.allergicIngredients)}
            />
            <DetailItem
              label="Double Cleanse Preference"
              value={booking.surveyResponse.doubleCleansePreference}
            />
            <DetailItem
              label="Sleep Hours"
              value={booking.surveyResponse.sleepHours}
            />
            <DetailItem
              label="Water Intake"
              value={booking.surveyResponse.waterIntake}
            />
            <DetailItem
              label="Wants Consultation"
              value={booking.surveyResponse.wantsConsultation ? "Yes" : "No"}
            />
            <DetailItem
              label="Applies Sunscreen"
              value={booking.surveyResponse.appliesSunscreen ? "Yes" : "No"}
            />
            <DetailItem
              label="Regular Period Cycle"
              value={booking.surveyResponse.regularPeriodCycle ? "Yes" : "No"}
            />
            <DetailItem
              label="Used IndoPak Night Cream"
              value={booking.surveyResponse.usedIndoPakNightCream ? "Yes" : "No"}
            />
            <DetailItem
              label="Additional Notes"
              value={booking.surveyResponse.note ?? "No additional notes"}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-foreground/70">
            No survey response was submitted for this booking.
          </p>
        )}
      </section>
    </section>
  );
}
