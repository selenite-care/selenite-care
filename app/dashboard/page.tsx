import Link from "next/link";
import NextAuth from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [totalBookings, lastBooking] = await Promise.all([
    db.booking.count({
      where: {
        userId: session.user.id,
      },
    }),
    db.booking.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        status: true,
      },
    }),
  ]);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase text-foreground/60">
            Client Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Welcome, {session.user.name ?? "Client"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Here is a quick look at your recent booking activity.
          </p>
        </div>

        <Link
          href="/services"
          className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
        >
          Book New Appointment
        </Link>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <article className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <p className="text-sm font-medium text-foreground/60">
            Logged-in Client
          </p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            {session.user.name ?? "Client"}
          </p>
        </article>

        <article className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <p className="text-sm font-medium text-foreground/60">
            Total Bookings
          </p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            {totalBookings}
          </p>
        </article>

        <article className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <p className="text-sm font-medium text-foreground/60">
            Last Booking Status
          </p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            {lastBooking?.status ?? "No bookings yet"}
          </p>
        </article>
      </div>
    </section>
  );
}
