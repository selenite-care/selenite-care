import { db } from "@/lib/db";

export async function GET() {
  const services = await db.service.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return Response.json({ services });
}
