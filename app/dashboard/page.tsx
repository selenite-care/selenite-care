import Link from "next/link";
import NextAuth from "next-auth";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import DashboardWelcome from "./DashboardWelcome";
import LatestSkinAssessmentCard from "./LatestSkinAssessmentCard";
import NextAppointmentCard from "./NextAppointmentCard";
import QuickActions from "./QuickActions";
import MembershipCountdown from "@/components/membership/MembershipCountdown";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { isMembershipAvailable } from "@/lib/membershipAvailability";
import { MEMBERSHIP_PRICES } from "@/lib/membershipDiscounts";
import { expirePastActiveMemberships } from "@/lib/membershipStatus";

const { auth } = NextAuth(authConfig);

const MEMBERSHIP_AMOUNTS = {
  SIGNATURE: MEMBERSHIP_PRICES.SIGNATURE.price,
  CRYSTAL: MEMBERSHIP_PRICES.CRYSTAL.price,
  PLATINUM: MEMBERSHIP_PRICES.PLATINUM.price,
} as const;

function formatBdt(amount: number) {
  return `${amount.toLocaleString("en-US")} BDT`;
}

function getTierClasses(tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM" | string) {
  switch (tier) {
    case "PLATINUM":
      return "bg-[#2B2B2B] text-[#F8F5F0] dark:bg-[#B87B68] dark:text-[#141210]";
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
        label: `Upgrade to Crystal - ${formatBdt(MEMBERSHIP_AMOUNTS.CRYSTAL)}`,
      },
      {
        tier: "PLATINUM" as const,
        label: `Upgrade to Platinum - ${formatBdt(MEMBERSHIP_AMOUNTS.PLATINUM)}`,
      },
    ].filter((option) => isMembershipAvailable(option.tier));
  }

  if (tier === "CRYSTAL") {
    return [
      {
        tier: "PLATINUM" as const,
        label: `Upgrade to Platinum - ${formatBdt(MEMBERSHIP_AMOUNTS.PLATINUM)}`,
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

  await expirePastActiveMemberships();

  const [totalBookings, lastBooking, membership, completedDiagnosedBookings] =
    await Promise.all([
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
          createdAt: true,
          expiresAt: true,
        },
      }),
      db.booking.findMany({
        where: {
          userId: session.user.id,
          status: "COMPLETED",
          diagnosis: {
            isNot: null,
          },
        },
        select: {
          diagnosis: {
            select: {
              recommendations: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const currentTime = new Date().getTime();
  const hasActiveMembership =
    membership?.status === "ACTIVE" &&
    membership.expiresAt &&
    membership.expiresAt.getTime() > currentTime;

  const isExpiredMembership =
    !!membership &&
    (membership.status === "EXPIRED" ||
      membership.status === "CANCELLED" ||
      (membership.status === "ACTIVE" &&
        (!membership.expiresAt || membership.expiresAt.getTime() <= currentTime)));

  const upgradeOptions =
    membership?.tier && membership.status === "ACTIVE"
      ? getUpgradeOptions(membership.tier)
      : [];
  const totalRecommendedProducts = completedDiagnosedBookings.reduce(
    (total, booking) => total + (booking.diagnosis?.recommendations.length ?? 0),
    0,
  );
  const appointmentCtaSubtext = hasActiveMembership
    ? "Your membership is active — book now"
    : "Get a membership to book appointments";

  return (
    <section className="flex flex-col gap-6 pb-24 md:pb-6">
      <DashboardWelcome name={session.user.name} />

      <QuickActions />

      <article
        className={`overflow-hidden rounded-2xl border border-[#EADDCD] p-5 shadow-sm dark:border-[#3D3530] ${
          totalBookings === 0
            ? "bg-[linear-gradient(135deg,#F8F5F0_0%,#EFE1D2_54%,rgba(184,123,104,0.16)_100%)] dark:bg-[linear-gradient(135deg,#242220_0%,#1A1814_58%,rgba(212,180,122,0.16)_100%)]"
            : "bg-white dark:bg-[#242220]"
        }`}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#B87B68]/15 text-[#B87B68] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2
                className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                My Skin Journey
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
                {totalBookings > 0
                  ? `You have had ${totalBookings} ${
                      totalBookings === 1 ? "consultation" : "consultations"
                    } with us`
                  : "Your journey of transformation starts here"}
              </p>
              {totalRecommendedProducts > 0 ? (
                <p className="mt-3 inline-flex rounded-full bg-[#B87B68]/15 px-3 py-1 text-xs font-semibold text-[#8A6A2F] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
                  {totalRecommendedProducts} products recommended across your
                  journey
                </p>
              ) : null}
            </div>
          </div>

          <Link
            href="/dashboard/journey"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-[var(--sidebar)] px-5 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
          >
            View My Journey
          </Link>
        </div>
      </article>

      {hasActiveMembership && membership?.expiresAt ? (
        <div className="flex flex-col gap-4">
          <MembershipCountdown
            createdAt={membership.createdAt}
            expiresAt={membership.expiresAt}
            membershipId={membership.membershipId}
            tier={membership.tier}
          />
          {membership.tier !== "PLATINUM" && upgradeOptions.length > 0 ? (
            <article className="bg-card border-themed rounded-xl border border-l-4 border-l-[var(--gold)] p-5">
              <p className="text-muted text-xs font-semibold uppercase tracking-widest">
                Upgrade Available
              </p>
              <p className="text-page mt-2 text-base font-semibold">
                Unlock more with a higher tier
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {upgradeOptions.map((option) => (
                  <Link
                    key={option.tier}
                    href={`/membership/payment?tier=${option.tier}`}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--sidebar)] px-4 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </article>
          ) : null}
        </div>
      ) : isExpiredMembership ? (
        <article className="rounded-xl border border-red-300 border-l-4 border-l-red-600 bg-red-50 p-5 dark:border-red-900/60 dark:border-l-red-500 dark:bg-red-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                Membership Expired
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Renew to book your next consultation.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Renew Now
            </Link>
          </div>
        </article>
      ) : (
        <article className="rounded-xl border border-[#EADDCD] border-l-4 border-l-[#B87B68] bg-[#F8F5F0] p-5 dark:border-[#3D3530] dark:bg-[#242220]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-page text-base font-semibold">
                No Membership Yet
              </p>
              <p className="text-muted mt-1 text-sm">
                Get your first membership to unlock consultations.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-[var(--sidebar)] px-5 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90"
            >
              Get Membership
            </Link>
          </div>
        </article>
      )}

      <NextAppointmentCard hasActiveMembership={Boolean(hasActiveMembership)} />

      <LatestSkinAssessmentCard />

      <div className="grid grid-cols-3 gap-3">
        <article className="bg-card border-themed rounded-xl border p-4 text-center">
          <p className="text-muted text-xs font-medium">Total Bookings</p>
          <p className="text-page mt-2 text-2xl font-bold">{totalBookings}</p>
        </article>
        <article className="bg-card border-themed rounded-xl border p-4 text-center">
          <p className="text-muted text-xs font-medium">Last Status</p>
          <p className="text-page mt-2 truncate text-sm font-semibold">
            {lastBooking?.status ?? "—"}
          </p>
        </article>
        <article className="bg-card border-themed rounded-xl border p-4 text-center">
          <p className="text-muted text-xs font-medium">Membership</p>
          <p className="text-page mt-2 truncate text-sm font-semibold">
            {membership?.tier ?? "None"}
          </p>
        </article>
      </div>
    </section>
  );
}
