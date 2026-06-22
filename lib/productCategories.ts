import { db } from "@/lib/db";

export const STOCK_STATUS_LABELS = {
  AVAILABLE: "In Stock",
  LIMITED: "Limited Stock",
  OUT_OF_STOCK: "Out of Stock",
} as const;

export const STOCK_STATUS_COLORS = {
  AVAILABLE: "green",
  LIMITED: "amber",
  OUT_OF_STOCK: "red",
} as const;

export async function getProductCategories() {
  const products = await db.product.findMany({
    where: {
      isVisible: true,
    },
    select: {
      type: true,
    },
    distinct: ["type"],
    orderBy: {
      type: "asc",
    },
  });

  return products.map((product) => product.type);
}
