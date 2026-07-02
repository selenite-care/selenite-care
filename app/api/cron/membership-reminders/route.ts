import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { formatDateOnly } from "@/lib/dateUtils";

export const runtime = "nodejs";

type ReminderMembership = {
  id: string;
  membershipId: string;
  tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
  expiresAt: Date | null;
  user: {
    name: string | null;
    email: string;
  };
};

function getServicesUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://selenitecare.com";

  return `${baseUrl}/services`;
}

function formatTierLabel(tier: ReminderMembership["tier"]) {
  switch (tier) {
    case "SIGNATURE":
      return "Signature";
    case "CRYSTAL":
      return "Crystal";
    case "PLATINUM":
      return "Platinum";
  }
}

function getMembershipEmailHtml({
  title,
  intro,
  membership,
  buttonText,
}: {
  title: string;
  intro: string;
  membership: ReminderMembership;
  buttonText: string;
}) {
  const clientName = membership.user.name?.trim() || "Valued Client";
  const expiryDate = formatDateOnly(membership.expiresAt);
  const servicesUrl = getServicesUrl();

  return `
    <div style="margin:0;padding:32px 16px;background-color:#F8F5F0;font-family:Arial,sans-serif;color:#2B2B2B;">
      <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #EADDCD;border-radius:18px;overflow:hidden;">
        <div style="padding:24px 28px;background:#2B2B2B;color:#F8F5F0;">
          <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#B87B68;">Selenite Care</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-family:'Playfair Display',Georgia,serif;">${title}</h1>
          <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#EDE6DA;">${intro}</p>
        </div>

        <div style="padding:28px;">
          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">Hello ${clientName},</p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
            <tbody>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;width:42%;">Membership ID</td>
                <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;font-weight:600;">${membership.membershipId}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Tier</td>
                <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;">${formatTierLabel(membership.tier)}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;color:#6E6257;">Expiry Date</td>
                <td style="padding:12px 0;border-bottom:1px solid #E9DFD2;font-weight:600;color:#8A6A2F;">${expiryDate}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top:28px;text-align:center;">
            <a href="${servicesUrl}" style="display:inline-block;padding:14px 24px;background:#B87B68;color:#2B2B2B;text-decoration:none;border-radius:8px;font-weight:700;">
              ${buttonText}
            </a>
          </div>

          <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#6E6257;">
            If you have questions, reply to this email and our team will help you choose the right next step.
          </p>
        </div>
      </div>
    </div>
  `;
}

async function sendMembershipEmail({
  membership,
  subject,
  title,
  intro,
  buttonText,
}: {
  membership: ReminderMembership;
  subject: string;
  title: string;
  intro: string;
  buttonText: string;
}) {
  await sendEmail({
    to: membership.user.email,
    subject,
    html: getMembershipEmailHtml({
      title,
      intro,
      membership,
      buttonText,
    }),
  });
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();
  const oneDayFromNow = new Date(now);
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const summary = {
    renewalRemindersProcessed: 0,
    urgentRemindersProcessed: 0,
    expiredMembershipsProcessed: 0,
    emailFailures: 0,
  };

  try {
    const [renewalReminderMemberships, urgentReminderMemberships, expiredMemberships] =
      await Promise.all([
        db.membership.findMany({
          where: {
            status: "ACTIVE",
            expiresAt: {
              gt: oneDayFromNow,
              lte: sevenDaysFromNow,
            },
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),
        db.membership.findMany({
          where: {
            status: "ACTIVE",
            expiresAt: {
              gte: now,
              lte: oneDayFromNow,
            },
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),
        db.membership.findMany({
          where: {
            status: "ACTIVE",
            expiresAt: {
              lt: now,
            },
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),
      ]);

    for (const membership of renewalReminderMemberships) {
      try {
        await sendMembershipEmail({
          membership,
          subject: "Your Selenite Care Membership Expires in 7 Days",
          title: "Your Membership Is Ending Soon",
          intro:
            "Your Selenite Care membership is within its final week. Renew now to keep your skincare support uninterrupted.",
          buttonText: "Renew Now",
        });
        summary.renewalRemindersProcessed += 1;
      } catch (error) {
        console.error("Failed to send renewal reminder", membership.id, error);
        summary.emailFailures += 1;
      }
    }

    for (const membership of urgentReminderMemberships) {
      try {
        await sendMembershipEmail({
          membership,
          subject: "Last Day — Your Selenite Care Membership Expires Tomorrow",
          title: "Last Day To Renew",
          intro:
            "Your Selenite Care membership expires tomorrow. Renew today to continue your personalized skincare guidance.",
          buttonText: "Renew Now",
        });
        summary.urgentRemindersProcessed += 1;
      } catch (error) {
        console.error("Failed to send urgent reminder", membership.id, error);
        summary.emailFailures += 1;
      }
    }

    for (const membership of expiredMemberships) {
      await db.membership.update({
        where: {
          id: membership.id,
        },
        data: {
          status: "EXPIRED",
        },
      });

      try {
        await sendMembershipEmail({
          membership,
          subject: "Your Selenite Care Membership Has Expired",
          title: "Your Membership Has Expired",
          intro:
            "Your Selenite Care membership has expired. Start a new membership to continue receiving expert skincare support.",
          buttonText: "Get New Membership",
        });
        summary.expiredMembershipsProcessed += 1;
      } catch (error) {
        console.error("Failed to send expiry notification", membership.id, error);
        summary.emailFailures += 1;
      }
    }

    return Response.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Failed to process membership reminders", error);
    return Response.json(
      { error: "Failed to process membership reminders.", summary },
      { status: 500 },
    );
  }
}
