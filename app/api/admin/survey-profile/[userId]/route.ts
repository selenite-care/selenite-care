import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

const allowedRoles = new Set(["ADMIN", "DOCTOR", "CRM"]);

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!allowedRoles.has(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { userId } = await context.params;

  if (!userId) {
    return Response.json({ error: "User ID is required." }, { status: 400 });
  }

  const surveyProfile = await db.surveyProfile.findUnique({
    where: { userId },
  });

  if (!surveyProfile) {
    return Response.json({ error: "Survey profile not found." }, { status: 404 });
  }

  return Response.json({ surveyProfile });
}
