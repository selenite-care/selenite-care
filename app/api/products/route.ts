import type { Prisma, StockStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getProductCategories } from "@/lib/productCategories";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 24;

const STOCK_STATUSES: StockStatus[] = [
  "AVAILABLE",
  "LIMITED",
  "OUT_OF_STOCK",
];

function parseStockStatus(value: string | null): StockStatus | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase() as StockStatus;
  return STOCK_STATUSES.includes(normalized) ? normalized : null;
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function parseIdList(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type")?.trim() ?? "";
  const stockStatus = parseStockStatus(searchParams.get("stockStatus"));
  const recommendedIds = parseIdList(searchParams.get("recommendedIds"));
  const page = parsePositiveInt(
    searchParams.get("page"),
    DEFAULT_PAGE,
  );
  const requestedPageSize = parsePositiveInt(
    searchParams.get("pageSize"),
    DEFAULT_PAGE_SIZE,
  );
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);

  const where: Prisma.ProductWhereInput = {
    isVisible: true,
  };

  if (query) {
    where.OR = [
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
    ];
  }

  if (type) {
    where.type = type;
  }

  if (stockStatus) {
    where.stockStatus = stockStatus;
  }

  if (recommendedIds.length > 0) {
    where.id = {
      in: recommendedIds,
    };
  }

  const [totalCount, types] = await Promise.all([
    db.product.count({ where }),
    getProductCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const products = await db.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      type: true,
      price: true,
      skinType: true,
      stockStatus: true,
      stockNote: true,
      description: true,
      ingredients: true,
      image: true,
    },
    orderBy: [
      {
        type: "asc",
      },
      {
        name: "asc",
      },
    ],
    skip,
    take: pageSize,
  });

  return Response.json({
    products,
    types,
    pagination: {
      page: currentPage,
      pageSize,
      totalCount,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    },
  });
}
