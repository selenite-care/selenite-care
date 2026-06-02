import Link from "next/link";
import NextAuth from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import BookingStatusButtons from "./BookingStatusButtons";

type CrmBookingDetailsPageProps = {
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

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
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

function formatWaterIntake(value: string | string[] | null | undefined) {
  if (!value || value.length === 0) {
    return "Not specified";
  }

  return Array.isArray(value) ? value.join(", ") : value;
}

export default async function CrmBookingDetailsPage({
  params,
}: CrmBookingDetailsPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "CRM") {
    redirect("/dashboard");
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
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
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
          <p className="font-mono text-sm text-foreground/60">{booking.token}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Booking Details
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Review the full client appointment record and update CRM-visible status.
          </p>
        </div>

        <Link
          href="/crm/bookings"
          className="inline-flex h-11 items-center justify-center rounded-md border border-black/10 bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          Back to Bookings
        </Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Client Info</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={booking.user.name ?? "Not set"} />
            <DetailItem label="Email" value={booking.user.email} />
            <DetailItem label="Phone" value={booking.user.phone ?? "Not set"} />
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
            <DetailItem label="Duration" value={`${booking.service.duration} minutes`} />
            <DetailItem label="Price" value={`$${booking.service.price.toFixed(2)}`} />
            <DetailItem
              label="Description"
              value={booking.service.description ?? "Not provided"}
            />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Doctor</h2>
          {booking.doctor ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Name" value={booking.doctor.name} />
              <DetailItem label="Designation" value={booking.doctor.designation} />
              <DetailItem label="Availability" value={booking.doctor.availability} />
              <DetailItem label="Bio" value={booking.doctor.bio ?? "Not provided"} />
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-foreground/70">
              No doctor has been assigned to this booking.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Appointment</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Appointment Time" value={booking.appointmentTime.toLocaleString()} />
            <DetailItem label="Created" value={booking.createdAt.toLocaleString()} />
            <DetailItem label="Booking Token" value={booking.token} />
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

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10 xl:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Payment Info</h2>
          {booking.payment ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <DetailItem
                label="Payment Status"
                value={
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getPaymentStatusBadgeClasses(
                      booking.payment.status,
                    )}`}
                  >
                    {booking.payment.status}
                  </span>
                }
              />
              <DetailItem label="Amount" value={`$${booking.payment.amount.toFixed(2)}`} />
              <DetailItem
                label="Stripe Payment ID"
                value={
                  <span className="break-all font-mono text-xs">
                    {booking.payment.stripePaymentId}
                  </span>
                }
              />
              <DetailItem label="Paid At" value={booking.payment.createdAt.toLocaleString()} />
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-foreground/70">
              No payment record is attached to this booking.
            </p>
          )}
        </section>
      </div>

      <BookingStatusButtons bookingId={booking.id} currentStatus={booking.status} />

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-foreground">Survey Responses</h2>
        {booking.surveyResponse ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="Name" value={booking.surveyResponse.name} />
            <DetailItem label="Age" value={booking.surveyResponse.age} />
            <DetailItem label="Phone" value={booking.surveyResponse.phone} />
            <DetailItem label="Email" value={booking.surveyResponse.email} />
            <DetailItem label="Skin Type" value={booking.surveyResponse.skinType} />
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
            <DetailItem label="Sleep Hours" value={booking.surveyResponse.sleepHours} />
            <DetailItem
              label="Water Intake"
              value={formatWaterIntake(booking.surveyResponse.waterIntake)}
            />
            <DetailItem
              label="Uses Korean Products"
              value={yesNo(booking.surveyResponse.usesKoreanProducts)}
            />
            <DetailItem
              label="Facing Skin Issues"
              value={yesNo(booking.surveyResponse.facingSkinIssues)}
            />
            <DetailItem
              label="Applies Sunscreen"
              value={yesNo(booking.surveyResponse.appliesSunscreen)}
            />
            <DetailItem
              label="Regular Period Cycle"
              value={yesNo(booking.surveyResponse.regularPeriodCycle)}
            />
            <DetailItem
              label="Used Ind/Pak Night Cream"
              value={yesNo(booking.surveyResponse.usedIndoPakNightCream)}
            />
            <DetailItem label="Code ID" value={booking.surveyResponse.codeId ?? "Not provided"} />
            <DetailItem
              label="Additional Notes"
              value={booking.surveyResponse.note ?? "No additional notes"}
            />
            <DetailItem
              label="Submitted At"
              value={booking.surveyResponse.createdAt.toLocaleString()}
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
