import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import db from "@/lib/db";

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

function formatAppointmentTime(value: Date) {
  return value.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function CrmBookingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "CRM") {
    redirect("/dashboard");
  }

  const bookings = await db.booking.findMany({
    orderBy: {
      appointmentTime: "desc",
    },
    select: {
      id: true,
      token: true,
      appointmentTime: true,
      status: true,
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
      doctor: {
        select: {
          name: true,
        },
      },
      payment: {
        select: {
          id: true,
          status: true,
          amount: true,
        },
      },
    },
  });

  return (
    <section className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 rounded-3xl border border-black/10 bg-background p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-3xl font-semibold text-foreground">All Bookings</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Review client appointments, assigned doctors, and booking statuses.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-black/10 bg-background shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/10 text-left dark:divide-white/10">
              <thead className="bg-zinc-100 text-sm uppercase tracking-wide text-foreground/60 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-4">Booking Token</th>
                  <th className="px-4 py-4">Client Name</th>
                  <th className="px-4 py-4">Client Phone</th>
                  <th className="px-4 py-4">Service</th>
                  <th className="px-4 py-4">Doctor</th>
                  <th className="px-4 py-4">Appointment Time</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 bg-white text-sm dark:divide-white/10 dark:bg-zinc-900">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-foreground/70">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-4 py-4 font-mono text-xs text-foreground">
                        <Link
                          href={`/crm/bookings/${booking.id}`}
                          className="transition-colors hover:text-foreground/70"
                        >
                          {booking.token}
                        </Link>
                      </td>
                      <td className="px-4 py-4 font-medium text-foreground">
                        {booking.user.name ?? "-"}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {booking.user.phone ?? "-"}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {booking.service.name}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {booking.doctor?.name ?? "-"}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {formatAppointmentTime(booking.appointmentTime)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getBookingStatusBadgeClasses(
                            booking.status,
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
