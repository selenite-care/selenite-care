import Link from "next/link";
import NextAuth from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";
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

const { auth } = NextAuth(authConfig);

function joinValues(values?: string[]) {
  if (!values || values.length === 0) {
    return "None";
  }

  return values.join(", ");
}

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

function getPaymentStatusBadgeClasses(status: string) {
  switch (status) {
    case "UNPAID":
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-300";
    case "PAID":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300";
    case "REFUNDED":
      return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    default:
      return "border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5";
  }
}

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
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
      service: {
        select: {
          name: true,
          description: true,
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
          <h2 className="text-lg font-semibold text-foreground">Service</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Service Name"
              value={booking.service?.name ?? "No service attached"}
            />
            <DetailItem
              label="Appointment Creation Time"
              value={booking.createdAt.toLocaleString()}
            />
            <DetailItem
              label="Appointment Taken Time"
              value={booking.appointmentTime?.toLocaleString() ?? "Not scheduled"}
            />
            <DetailItem label="Booking Token" value={booking.id} />
            <DetailItem
              label="Status"
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
              label="Price"
              value={
                booking.service ? formatBdt(booking.service?.price ?? 0) : "Not available"
              }
            />
            <DetailItem
              label="Description"
              value={booking.service?.description ?? "No description"}
            />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Payment Info</h2>
          {booking.payment ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Payment Status"
                value={
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getPaymentStatusBadgeClasses(
                      booking.payment?.status ?? "UNPAID",
                    )}`}
                  >
                    {booking.payment?.status ?? "UNPAID"}
                  </span>
                }
              />
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
            <DetailItem label="Name" value={booking.surveyResponse?.name ?? "Not provided"} />
            <DetailItem label="Age" value={booking.surveyResponse?.age ?? "Not provided"} />
            <DetailItem label="Phone" value={booking.surveyResponse?.phone ?? "Not provided"} />
            <DetailItem label="Email" value={booking.surveyResponse?.email ?? "Not provided"} />
            <DetailItem label="Skin Type" value={booking.surveyResponse?.skinType ?? "Not provided"} />
            <DetailItem
              label="Code ID"
              value={booking.surveyResponse?.codeId ?? "Not provided"}
            />
            <DetailItem
              label="Uses Korean Products"
              value={booking.surveyResponse?.usesKoreanProducts ? "Yes" : "No"}
            />
            <DetailItem
              label="Facing Skin Issues"
              value={booking.surveyResponse?.facingSkinIssues ? "Yes" : "No"}
            />
            <DetailItem
              label="Skin Issues"
              value={joinValues(booking.surveyResponse?.skinIssues)}
            />
            <DetailItem
              label="Issue Duration"
              value={booking.surveyResponse?.skinIssueDuration ?? "Not specified"}
            />
            <DetailItem
              label="Current Products"
              value={joinValues(booking.surveyResponse?.currentProducts)}
            />
            <DetailItem
              label="Allergic Ingredients"
              value={joinValues(booking.surveyResponse?.allergicIngredients)}
            />
            <DetailItem
              label="Double Cleanse Preference"
              value={booking.surveyResponse?.doubleCleansePreference ?? "Not specified"}
            />
            <DetailItem
              label="Sleep Hours"
              value={booking.surveyResponse?.sleepHours ?? "Not specified"}
            />
            <DetailItem
              label="Water Intake"
              value={
                booking.surveyResponse?.waterIntake
                  ? Array.isArray(booking.surveyResponse?.waterIntake)
                    ? booking.surveyResponse?.waterIntake?.join(", ")
                    : booking.surveyResponse?.waterIntake
                  : "Not specified"
              }
            />
            <DetailItem
              label="Applies Sunscreen"
              value={booking.surveyResponse?.appliesSunscreen ? "Yes" : "No"}
            />
            <DetailItem
              label="Regular Period Cycle"
              value={booking.surveyResponse?.regularPeriodCycle ? "Yes" : "No"}
            />
            <DetailItem
              label="Used Steroid Based Night Cream"
              value={booking.surveyResponse?.usedSteroidBasedNightCream ? "Yes" : "No"}
            />
            <DetailItem
              label="Additional Notes"
              value={booking.surveyResponse?.note ?? "No additional notes"}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-foreground/70">
            No survey response was submitted for this booking.
          </p>
        )}
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
