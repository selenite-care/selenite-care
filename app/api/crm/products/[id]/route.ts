import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { StockStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ProductPatchPayload = {
  stockStatus?: unknown;
  stockNote?: unknown;
  image?: unknown;
  description?: unknown;
  name?: unknown;
  type?: unknown;
  skinType?: unknown;
  price?: unknown;
  isVisible?: unknown;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json({ error: "Product ID is required." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as ProductPatchPayload;
  const stockStatus =
    typeof body.stockStatus === "string" ? body.stockStatus.trim().toUpperCase() : undefined;
  const stockNote =
    typeof body.stockNote === "string" ? body.stockNote.trim() : undefined;
  const image = typeof body.image === "string" ? body.image.trim() : undefined;
  const description =
    typeof body.description === "string" ? body.description.trim() : undefined;
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const type = typeof body.type === "string" ? body.type.trim() : undefined;
  const skinType =
    typeof body.skinType === "string" ? body.skinType.trim() : undefined;
  const rawPrice =
    typeof body.price === "number"
      ? body.price
      : typeof body.price === "string"
        ? Number(body.price)
        : undefined;
  const price =
    rawPrice === undefined || Number.isNaN(rawPrice) ? undefined : rawPrice;
  const isVisible =
    typeof body.isVisible === "boolean" ? body.isVisible : undefined;

  if (
    stockStatus !== undefined &&
    stockStatus !== "AVAILABLE" &&
    stockStatus !== "LIMITED" &&
    stockStatus !== "OUT_OF_STOCK"
  ) {
    return Response.json({ error: "Invalid stock status." }, { status: 400 });
  }

  if (name !== undefined && !name) {
    return Response.json({ error: "Name cannot be empty." }, { status: 400 });
  }

  if (type !== undefined && !type) {
    return Response.json({ error: "Type cannot be empty." }, { status: 400 });
  }

  if (price !== undefined && price < 0) {
    return Response.json({ error: "Price must be a valid non-negative number." }, { status: 400 });
  }

  const updatedProduct = await db.product.update({
    where: { id },
    data: {
      ...(stockStatus !== undefined ? { stockStatus: stockStatus as StockStatus } : {}),
      ...(stockNote !== undefined ? { stockNote: stockNote || null } : {}),
      ...(image !== undefined ? { image: image || null } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(skinType !== undefined ? { skinType: skinType || null } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(isVisible !== undefined ? { isVisible } : {}),
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

  return Response.json({ product: updatedProduct });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  if (!id) {
    return Response.json({ error: "Product ID is required." }, { status: 400 });
  }

  await db.product.delete({
    where: { id },
  });

  return Response.json({ success: true });
}
