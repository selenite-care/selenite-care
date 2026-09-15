import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { EarningsChart, ReferralCodeCard } from "./InfluencerOverviewWidgets";

function formatBdt(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")} BDT`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getFirstName(name: string | null) {
  return name?.trim().split(/\s+/)[0] || "Client";
}

function getWeekStart(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  return nextDate;
}

function getWeekLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getLastEightWeeksChartData(
  referrals: Array<{
    createdAt: Date;
    commissionAmount: number;
  }>,
) {
  const currentWeekStart = getWeekStart(new Date());
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - (7 - index) * 7);

    return {
      key: weekStart.toISOString().slice(0, 10),
      week: getWeekLabel(weekStart),
      commission: 0,
    };
  });
  const weekMap = new Map(weeks.map((week) => [week.key, week]));

  for (const referral of referrals) {
    const weekStart = getWeekStart(referral.createdAt);
    const key = weekStart.toISOString().slice(0, 10);
    const week = weekMap.get(key);

    if (week) {
      week.commission += referral.commissionAmount;
    }
  }

  return weeks.map(({ week, commission }) => ({
    week,
    commission,
  }));
}

function getStatusClasses(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300";
    case "PENDING":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
    default:
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
  }
}

export default async function InfluencerPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const influencer = await db.influencer.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      referrals: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          client: {
            select: {
              name: true,
            },
          },
          membership: {
            select: {
              tier: true,
            },
          },
        },
      },
      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!influencer) {
    redirect("/dashboard");
  }

  const pendingCommission = Math.max(
    0,
    influencer.totalEarned - influencer.totalPaid,
  );
  const recentReferrals = influencer.referrals.slice(0, 5);
  const chartData = getLastEightWeeksChartData(influencer.referrals);
  const referralLink = `selenitecare.com/ref/${influencer.referralCode}`;
  const stats = [
    {
      label: "Total Referrals",
      value: influencer.referrals.length.toLocaleString("en-US"),
    },
    {
      label: "Pending Commission",
      value: formatBdt(pendingCommission),
    },
    {
      label: "Total Earned",
      value: formatBdt(influencer.totalEarned),
    },
    {
      label: "Total Paid",
      value: formatBdt(influencer.totalPaid),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#B87B68]">
          Influencer Dashboard
        </p>
        <h1
          className="mt-2 text-3xl font-bold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Overview
        </h1>
      </div>

      <ReferralCodeCard
        referralCode={influencer.referralCode}
        referralLink={referralLink}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#EADDCD] bg-white p-5 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967] dark:text-[#8A7D75]">
              {stat.label}
            </p>
            <p
              className="mt-3 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7967] dark:text-[#8A7D75]">
            Recent Referrals
          </p>
          <h2
            className="mt-2 text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Last 5 referral sales
          </h2>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#EADDCD] text-xs uppercase tracking-[0.12em] text-[#8C7967] dark:border-[#3D3530] dark:text-[#8A7D75]">
                <th className="px-3 py-3 font-semibold">Client</th>
                <th className="px-3 py-3 font-semibold">Membership</th>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Client Paid</th>
                <th className="px-3 py-3 font-semibold">Commission</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentReferrals.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-sm text-[#8C7967] dark:text-[#8A7D75]"
                  >
                    No referrals yet.
                  </td>
                </tr>
              ) : (
                recentReferrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className="border-b border-[#F0E6D8] last:border-0 dark:border-[#3D3530]"
                  >
                    <td className="px-3 py-4 font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {getFirstName(referral.client.name)}
                    </td>
                    <td className="px-3 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                      {referral.membership.tier}
                    </td>
                    <td className="px-3 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                      {formatDate(referral.createdAt)}
                    </td>
                    <td className="px-3 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                      {formatBdt(referral.clientPaid)}
                    </td>
                    <td className="px-3 py-4 font-semibold text-[#B87B68]">
                      {formatBdt(referral.commissionAmount)}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          referral.status,
                        )}`}
                      >
                        {referral.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <EarningsChart data={chartData} />
    </div>
  );
}
