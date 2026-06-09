import { redirect } from "next/navigation";
import { auth } from "@/auth";
import db from "@/lib/db";
import CrmBookingsClient from "./CrmBookingsClient";

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
    },
  });

  const bookingItems = bookings.map((booking) => ({
    ...booking,
    appointmentTime: booking.appointmentTime?.toISOString() ?? "Not scheduled",
  }));

  return (
    <section className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 rounded-3xl border border-black/10 bg-background p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-3xl font-semibold text-foreground">All Bookings</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Review client appointments, assigned doctors, and booking statuses.
          </p>
        </div>

        <CrmBookingsClient bookings={bookingItems} />
      </div>
    </section>
  );
}
