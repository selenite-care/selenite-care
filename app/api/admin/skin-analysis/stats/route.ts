import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type ConcernCountRow = {
  concern: string;
  count: bigint;
};

type SkinTypeCountRow = {
  skinType: string | null;
  count: bigint;
};

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const [
    totalAnalyses,
    analysesToday,
    concernRows,
    skinTypeRows,
  ] = await db.$transaction([
    db.skinAnalysis.count(),
    db.skinAnalysis.count({
      where: {
        createdAt: {
          gte: todayMidnight,
        },
      },
    }),
    db.$queryRaw<ConcernCountRow[]>`
      SELECT concern, COUNT(*)::bigint AS count
      FROM "SkinAnalysis", unnest("concerns") AS concern
      WHERE concern <> ''
      GROUP BY concern
      ORDER BY count DESC
      LIMIT 6
    `,
    db.$queryRaw<SkinTypeCountRow[]>`
      SELECT "skinType", COUNT(*)::bigint AS count
      FROM "SkinAnalysis"
      WHERE "skinType" IS NOT NULL
      GROUP BY "skinType"
      ORDER BY count DESC
    `,
  ]);

  return Response.json({
    totalAnalyses,
    analysesToday,
    commonConcerns: concernRows.map((row) => ({
      concern: row.concern,
      count: Number(row.count),
    })),
    skinTypeDistribution: skinTypeRows.map((row) => ({
      skinType: row.skinType ?? "Unknown",
      count: Number(row.count),
    })),
  });
}
