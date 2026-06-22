import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { StockStatus } from "@prisma/client";

const PAGE_SIZE = 20;

type ProductPayload = {
  name?: unknown;
  type?: unknown;
  price?: unknown;
  description?: unknown;
  image?: unknown;
};

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") ?? "1") || 1, 1);
  const query = searchParams.get("q")?.trim() ?? "";
  const rawStockStatus = searchParams.get("stockStatus")?.trim().toUpperCase() ?? "";
  const stockStatus: StockStatus | undefined =
    rawStockStatus === "AVAILABLE" ||
    rawStockStatus === "LIMITED" ||
    rawStockStatus === "OUT_OF_STOCK"
      ? rawStockStatus
      : undefined;

  const where = {
    ...(query
      ? {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
            {
              type: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
            {
              skinType: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
    ...(stockStatus ? { stockStatus } : {}),
  };

  const [products, totalCount] = await Promise.all([
    db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        skinType: true,
        stockStatus: true,
        stockNote: true,
        image: true,
        description: true,
        isVisible: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
  ]);

  return Response.json({
    products,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages: Math.max(Math.ceil(totalCount / PAGE_SIZE), 1),
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as ProductPayload;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const price =
    typeof body.price === "number"
      ? body.price
      : typeof body.price === "string"
        ? Number(body.price)
        : Number.NaN;

  if (!name || !type || Number.isNaN(price) || price < 0) {
    return Response.json(
      { error: "Name, type, and a valid price are required." },
      { status: 400 },
    );
  }

  const product = await db.product.create({
    data: {
      name,
      type,
      price,
      description: description || null,
      image: image || null,
    },
    select: {
      id: true,
      name: true,
      type: true,
      price: true,
      skinType: true,
      stockStatus: true,
      stockNote: true,
      image: true,
      description: true,
      isVisible: true,
      createdAt: true,
    },
  });

  return Response.json({ product }, { status: 201 });
}
