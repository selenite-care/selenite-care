import Link from "next/link";
import NextAuth from "next-auth";
import { redirect } from "next/navigation";
import MembershipCountdown from "@/components/membership/MembershipCountdown";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

const MEMBERSHIP_AMOUNTS = {
  SIGNATURE: 490,
  CRYSTAL: 2900,
  PLATINUM: 6900,
} as const;

function getTierStyles(tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM" | string) {
  switch (tier) {
    case "PLATINUM":
      return {
        backgroundColor: "#2B2B2B",
        color: "#F8F5F0",
      };
    case "CRYSTAL":
      return {
        backgroundColor: "rgba(59, 130, 246, 0.14)",
        color: "#1D4ED8",
      };
    case "SIGNATURE":
    default:
      return {
        backgroundColor: "rgba(198, 165, 107, 0.16)",
        color: "#8A6A2F",
      };
  }
}

function getUpgradeOptions(tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM") {
  if (tier === "SIGNATURE") {
    return [
      {
        tier: "CRYSTAL" as const,
        label: `Upgrade to Crystal — ${MEMBERSHIP_AMOUNTS.CRYSTAL} BDT`,
      },
      {
        tier: "PLATINUM" as const,
        label: `Upgrade to Platinum — ${MEMBERSHIP_AMOUNTS.PLATINUM} BDT`,
      },
    ];
  }

  if (tier === "CRYSTAL") {
    return [
      {
        tier: "PLATINUM" as const,
        label: `Upgrade to Platinum — ${MEMBERSHIP_AMOUNTS.PLATINUM} BDT`,
      },
    ];
  }

  return [];
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [totalBookings, lastBooking, membership] = await Promise.all([
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
    db.membership.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        membershipId: true,
        tier: true,
        status: true,
        expiresAt: true,
      },
    }),
  ]);

  const hasActiveMembership =
    membership?.status === "ACTIVE" &&
    membership.expiresAt &&
    membership.expiresAt.getTime() > Date.now();

  const isExpiredMembership =
    !!membership &&
    (membership.status === "EXPIRED" ||
      membership.status === "CANCELLED" ||
      (membership.status === "ACTIVE" &&
        (!membership.expiresAt || membership.expiresAt.getTime() <= Date.now())));

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
        <div className="md:col-span-3">
          {hasActiveMembership && membership?.expiresAt ? (
            <div className="space-y-4">
              <MembershipCountdown
                expiresAt={membership.expiresAt}
                membershipId={membership.membershipId}
                tier={membership.tier}
              />

              {membership.tier !== "PLATINUM" ? (
                <article
                  className="rounded-lg border p-6"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#D8C7B5",
                    borderLeftColor: "#C6A56B",
                    borderLeftWidth: "4px",
                  }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "#B8A89A" }}
                      >
                        Upgrade Membership
                      </p>
                      <p
                        className="mt-3 text-lg font-semibold"
                        style={{ color: "#2B2B2B" }}
                      >
                        Unlock more support with a higher tier
                      </p>
                      <p
                        className="mt-2 text-sm leading-6"
                        style={{ color: "#6E6257" }}
                      >
                        Your current tier is {membership.tier}. You can upgrade at
                        any time for an expanded care experience.
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto">
                      {getUpgradeOptions(membership.tier).map((option) => (
                        <Link
                          key={option.tier}
                          href={`/membership/payment?tier=${option.tier}`}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-md px-5 py-3 text-sm font-medium transition-colors hover:opacity-90"
                          style={{
                            backgroundColor: "#2B2B2B",
                            color: "#F8F5F0",
                          }}
                        >
                          {option.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </article>
              ) : null}
            </div>
          ) : isExpiredMembership ? (
            <article
              className="rounded-lg border p-6"
              style={{
                backgroundColor: "#FFFFFF",
                borderColor: "#D8C7B5",
                borderLeftColor: "#C6A56B",
                borderLeftWidth: "4px",
              }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#B8A89A" }}>
                    Membership Status
                  </p>
                  <p
                    className="mt-3 text-2xl font-semibold tracking-tight text-red-600"
                  >
                    Membership Expired
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                      style={getTierStyles(membership.tier)}
                    >
                      {membership.tier}
                    </span>
                    <span
                      className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-red-600"
                    >
                      {membership.status}
                    </span>
                  </div>
                  <p
                    className="mt-4 text-sm leading-6"
                    style={{ color: "#6E6257" }}
                  >
                    Your membership is no longer active. Renew to continue your
                    consultation journey and unlock appointment access again.
                  </p>
                </div>

                <Link
                  href="/services"
                  className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
                >
                  Get Membership
                </Link>
              </div>
            </article>
          ) : (
            <article
              className="rounded-lg border p-6"
              style={{
                backgroundColor: "#FFFFFF",
                borderColor: "#D8C7B5",
                borderLeftColor: "#C6A56B",
                borderLeftWidth: "4px",
              }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#B8A89A" }}>
                    Membership Status
                  </p>
                  <p
                    className="mt-3 text-2xl font-semibold tracking-tight"
                    style={{ color: "#2B2B2B" }}
                  >
                    No Membership Yet
                  </p>
                  <p
                    className="mt-4 text-sm leading-6"
                    style={{ color: "#6E6257" }}
                  >
                    Get started with a membership to access guided skin care,
                    ongoing support, and appointment booking.
                  </p>
                </div>

                <Link
                  href="/services"
                  className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
                >
                  Get Membership
                </Link>
              </div>
            </article>
          )}
        </div>

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
