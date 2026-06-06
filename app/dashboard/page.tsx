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
          <p
            className="text-sm font-medium uppercase"
            style={{ color: "#B8A89A" }}
          >
            Client Dashboard
          </p>
          <h1
            className="mt-2 text-3xl font-semibold tracking-tight"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Welcome, {session.user.name ?? "Client"}
          </h1>
          <p className="mt-3 text-sm leading-6" style={{ color: "#B8A89A" }}>
            Here is a quick look at your recent booking activity.
          </p>
        </div>

        <Link
          href="/services"
          className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
        >
          Book New Appointment
        </Link>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <article
          className="rounded-lg border p-6"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#D8C7B5",
            borderLeftColor: "#C6A56B",
            borderLeftWidth: "4px",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "#B8A89A" }}>
            Logged-in Client
          </p>
          <p
            className="mt-4 text-2xl font-semibold tracking-tight"
            style={{ color: "#2B2B2B" }}
          >
            {session.user.name ?? "Client"}
          </p>
        </article>

        <article
          className="rounded-lg border p-6"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#D8C7B5",
            borderLeftColor: "#C6A56B",
            borderLeftWidth: "4px",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "#B8A89A" }}>
            Total Bookings
          </p>
          <p
            className="mt-4 text-2xl font-semibold tracking-tight"
            style={{ color: "#2B2B2B" }}
          >
            {totalBookings}
          </p>
        </article>

        <article
          className="rounded-lg border p-6"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#D8C7B5",
            borderLeftColor: "#C6A56B",
            borderLeftWidth: "4px",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "#B8A89A" }}>
            Last Booking Status
          </p>
          <p
            className="mt-4 text-2xl font-semibold tracking-tight"
            style={{ color: "#2B2B2B" }}
          >
            {lastBooking?.status ?? "No bookings yet"}
          </p>
        </article>
      </div>
    </section>
  );
}
