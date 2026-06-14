import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  const products = await db.product.findMany({
    where: query
      ? {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              type: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              skinType: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      type: true,
      price: true,
      skinType: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  return Response.json({ products });
}
