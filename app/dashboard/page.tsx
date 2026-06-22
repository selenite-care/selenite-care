import Link from "next/link";
import NextAuth from "next-auth";
import { redirect } from "next/navigation";
import MembershipCountdown from "@/components/membership/MembershipCountdown";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { isMembershipAvailable } from "@/lib/membershipAvailability";

const { auth } = NextAuth(authConfig);

const MEMBERSHIP_AMOUNTS = {
  SIGNATURE: 490,
  CRYSTAL: 3990,
  PLATINUM: 9990,
} as const;

function getTierClasses(tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM" | string) {
  switch (tier) {
    case "PLATINUM":
      return "bg-[#2B2B2B] text-[#F8F5F0] dark:bg-[#C6A56B] dark:text-[#141210]";
    case "CRYSTAL":
      return "bg-[rgba(59,130,246,0.14)] text-[#1D4ED8] dark:bg-[rgba(59,130,246,0.22)] dark:text-[#93C5FD]";
    case "SIGNATURE":
    default:
      return "bg-[rgba(198,165,107,0.16)] text-[#8A6A2F] dark:bg-[rgba(198,165,107,0.24)] dark:text-[#F3D58A]";
  }
}

function getUpgradeOptions(tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM") {
  if (tier === "SIGNATURE") {
    return [
      {
        tier: "CRYSTAL" as const,
        label: `Upgrade to Crystal - ${MEMBERSHIP_AMOUNTS.CRYSTAL} BDT`,
      },
      {
        tier: "PLATINUM" as const,
        label: `Upgrade to Platinum - ${MEMBERSHIP_AMOUNTS.PLATINUM} BDT`,
      },
    ].filter((option) => isMembershipAvailable(option.tier));
  }

  if (tier === "CRYSTAL") {
    return [
      {
        tier: "PLATINUM" as const,
        label: `Upgrade to Platinum - ${MEMBERSHIP_AMOUNTS.PLATINUM} BDT`,
      },
    ].filter((option) => isMembershipAvailable(option.tier));
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

  const upgradeOptions =
    membership?.tier && membership.status === "ACTIVE"
      ? getUpgradeOptions(membership.tier)
      : [];

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-muted text-sm font-medium uppercase">
            Client Dashboard
          </p>
          <h1 className="text-page mt-2 text-3xl font-semibold tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
            Welcome, {session.user.name ?? "Client"}
          </h1>
          <p className="text-muted mt-3 text-sm leading-6">
            Here is a quick look at your recent booking activity.
          </p>
        </div>

        <Link
          href="/services"
          className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--sidebar)] px-5 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90 dark:bg-[#D8C7B5] dark:text-[#2B2B2B]"
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

              {membership.tier !== "PLATINUM" && upgradeOptions.length > 0 ? (
                <article
                  className="bg-card border-themed rounded-lg border border-l-4 border-l-[var(--gold)] p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-muted text-sm font-medium">
                        Upgrade Membership
                      </p>
                      <p className="text-page mt-3 text-lg font-semibold">
                        Unlock more support with a higher tier
                      </p>
                      <p className="text-muted mt-2 text-sm leading-6">
                        Your current tier is {membership.tier}. You can upgrade at
                        any time for an expanded care experience.
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto">
                      {upgradeOptions.map((option) => (
                        <Link
                          key={option.tier}
                          href={`/membership/payment?tier=${option.tier}`}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[var(--sidebar)] px-5 py-3 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
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
              className="bg-card border-themed rounded-lg border border-l-4 border-l-[var(--gold)] p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-muted text-sm font-medium">
                    Membership Status
                  </p>
                  <p
                    className="mt-3 text-2xl font-semibold tracking-tight text-red-600"
                  >
                    Membership Expired
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${getTierClasses(
                        membership.tier,
                      )}`}
                    >
                      {membership.tier}
                    </span>
                    <span
                      className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-red-600 dark:bg-red-950/40 dark:text-red-300"
                    >
                      {membership.status}
                    </span>
                  </div>
                  <p className="text-muted mt-4 text-sm leading-6">
                    Your membership is no longer active. Renew to continue your
                    consultation journey and unlock appointment access again.
                  </p>
                </div>

                <Link
                  href="/services"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--sidebar)] px-5 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
                >
                  Get Membership
                </Link>
              </div>
            </article>
          ) : (
            <article
              className="bg-card border-themed rounded-lg border border-l-4 border-l-[var(--gold)] p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-muted text-sm font-medium">
                    Membership Status
                  </p>
                  <p className="text-page mt-3 text-2xl font-semibold tracking-tight">
                    No Membership Yet
                  </p>
                  <p className="text-muted mt-4 text-sm leading-6">
                    Get started with a membership to access guided skin care,
                    ongoing support, and appointment booking.
                  </p>
                </div>

                <Link
                  href="/services"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--sidebar)] px-5 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
                >
                  Get Membership
                </Link>
              </div>
            </article>
          )}
        </div>

        <article
          className="bg-card border-themed rounded-lg border border-l-4 border-l-[var(--gold)] p-6"
        >
          <p className="text-muted text-sm font-medium">
            Logged-in Client
          </p>
          <p className="text-page mt-4 text-2xl font-semibold tracking-tight">
            {session.user.name ?? "Client"}
          </p>
        </article>

        <article
          className="bg-card border-themed rounded-lg border border-l-4 border-l-[var(--gold)] p-6"
        >
          <p className="text-muted text-sm font-medium">
            Total Bookings
          </p>
          <p className="text-page mt-4 text-2xl font-semibold tracking-tight">
            {totalBookings}
          </p>
        </article>

        <article
          className="bg-card border-themed rounded-lg border border-l-4 border-l-[var(--gold)] p-6"
        >
          <p className="text-muted text-sm font-medium">
            Last Booking Status
          </p>
          <p className="text-page mt-4 text-2xl font-semibold tracking-tight">
            {lastBooking?.status ?? "No bookings yet"}
          </p>
        </article>
      </div>
    </section>
  );
}
