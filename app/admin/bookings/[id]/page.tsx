import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import BookingStatusControls from "./BookingStatusControls";
import PaymentStatusControls from "./PaymentStatusControls";

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

function joinValues(values?: string[]) {
  if (!values || values.length === 0) {
    return "None";
  }

  return values.join(", ");
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
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
              label="Appointment Taken Time"
              value={booking.appointmentTime.toLocaleString()}
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
          Selected Doctor
        </h2>
        {booking.doctor ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={booking.doctor.name} />
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
          currentStatus={booking.payment.status}
        />
      ) : null}

      <section className="mt-6 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-foreground">
          Survey Form Responses
        </h2>
        {booking.surveyResponse ? (
          <>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Name" value={booking.surveyResponse.name} />
              <DetailItem label="Age" value={booking.surveyResponse.age} />
              <DetailItem label="Phone" value={booking.surveyResponse.phone} />
              <DetailItem label="Email" value={booking.surveyResponse.email} />
              <DetailItem
                label="Skin Type"
                value={booking.surveyResponse.skinType}
              />
              <DetailItem
                label="Skin Issues"
                value={joinValues(booking.surveyResponse.skinIssues)}
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
                value={
                  booking.surveyResponse.waterIntake
                    ? Array.isArray(booking.surveyResponse.waterIntake)
                      ? booking.surveyResponse.waterIntake.join(", ")
                      : booking.surveyResponse.waterIntake
                    : "Not specified"
                }
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
                label="Used Steroid Based Night Cream"
                value={yesNo(booking.surveyResponse.usedSteroidBasedNightCream)}
              />
              <DetailItem
                label="Issue Duration"
                value={booking.surveyResponse.skinIssueDuration ?? "Not specified"}
              />
              <DetailItem
                label="Code ID"
                value={booking.surveyResponse.codeId ?? "Not provided"}
              />
              <DetailItem
                label="Additional Notes"
                value={booking.surveyResponse.note ?? "No additional notes"}
              />
              <DetailItem
                label="Submitted At"
                value={booking.surveyResponse.createdAt.toLocaleString()}
              />
            </div>

            {booking.surveyResponse.skinImages.length > 0 ? (
              <div className="mt-8">
                <h3 className="text-base font-semibold text-foreground">
                  Client Skin Photos
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {booking.surveyResponse.skinImages.map((imageUrl, index) => (
                    <a
                      key={imageUrl}
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg border border-black/10 bg-background transition-opacity hover:opacity-90 dark:border-white/10"
                    >
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={imageUrl}
                          alt={`Client skin concern photo ${index + 1}`}
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm leading-6 text-foreground/70">
            No survey response was submitted for this booking.
          </p>
        )}
      </section>
    </section>
  );
}
