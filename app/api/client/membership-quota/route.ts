import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { getLatestMembershipQuotaSummary } from "@/lib/membershipQuotaSummary";

const { auth } = NextAuth(authConfig);

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const membershipQuotaSummary = await getLatestMembershipQuotaSummary(
    session.user.id,
  );

  if (!membershipQuotaSummary) {
    return Response.json(null);
  }

  return Response.json(membershipQuotaSummary);
}
