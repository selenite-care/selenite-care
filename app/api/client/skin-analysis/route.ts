import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const analyses = await db.skinAnalysis.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      imageUrl: true,
      skinType: true,
      concerns: true,
      fullAnalysis: true,
      pdfUrl: true,
      createdAt: true,
    },
  });

  return Response.json({
    analyses,
    totalCount: analyses.length,
  });
}
