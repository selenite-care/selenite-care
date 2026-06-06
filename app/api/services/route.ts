import { db } from "@/lib/db";

export async function GET() {
  const services = await db.service.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      details: true,
      price: true,
      originalPrice: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return Response.json({ services });
}
