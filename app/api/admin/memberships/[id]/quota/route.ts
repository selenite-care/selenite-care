import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { getMembershipQuotaSummaryById } from "@/lib/membershipQuotaSummary";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json({ error: "Membership ID is required." }, { status: 400 });
  }

  const membershipQuotaSummary = await getMembershipQuotaSummaryById(id);

  if (!membershipQuotaSummary) {
    return Response.json({ error: "Membership not found." }, { status: 404 });
  }

  return Response.json(membershipQuotaSummary);
}
