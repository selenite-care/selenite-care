import { db } from "@/lib/db";

export async function GET() {
  const doctors = await db.doctor.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      designation: true,
      availability: true,
      bio: true,
      image: true,
    },
  });

  return Response.json({ doctors });
}
