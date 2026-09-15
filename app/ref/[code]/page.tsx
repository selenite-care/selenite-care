import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { validateReferralCode } from "@/lib/referralCode";
import ReferralRedirectClient from "./ReferralRedirectClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReferralPageProps = {
  params: Promise<{
    code: string;
  }>;
};

function getFirstName(name: string | null) {
  return name?.trim().split(/\s+/)[0] || "Someone";
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { code: rawCode } = await params;
  const code = validateReferralCode(rawCode);

  if (!code) {
    redirect("/landing");
  }

  const influencer = await db.influencer.findFirst({
    where: {
      referralCode: code,
      isActive: true,
    },
    select: {
      referralCode: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!influencer) {
    redirect("/landing");
  }

  return (
    <ReferralRedirectClient
      code={influencer.referralCode}
      influencerFirstName={getFirstName(influencer.user.name)}
    />
  );
}
