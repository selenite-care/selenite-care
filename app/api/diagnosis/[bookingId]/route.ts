import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

type RouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

type RecommendationInput =
  | string
  | {
      productId?: unknown;
      note?: unknown;
    };

type PutPayload = {
  problemIdentification?: unknown;
  productIds?: unknown;
};

const getAllowedRoles = new Set(["ADMIN", "DOCTOR", "CRM"]);
const putAllowedRoles = new Set(["ADMIN", "DOCTOR"]);

function normalizeRecommendations(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as Array<{ productId: string; note: string | null }>;
  }

  const deduped = new Map<string, { productId: string; note: string | null }>();

  for (const item of input as RecommendationInput[]) {
    if (typeof item === "string") {
      const productId = item.trim();
      if (productId) {
        deduped.set(productId, { productId, note: null });
      }
      continue;
    }

    if (!item || typeof item !== "object") {
      continue;
    }

    const productId =
      typeof item.productId === "string" ? item.productId.trim() : "";
    const note =
      typeof item.note === "string" && item.note.trim()
        ? item.note.trim()
        : null;

    if (productId) {
      deduped.set(productId, { productId, note });
    }
  }

  return Array.from(deduped.values());
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { bookingId } = await context.params;

  if (!bookingId) {
    return Response.json({ error: "Booking ID is required." }, { status: 400 });
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      diagnosis: {
        include: {
          recommendations: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  price: true,
                  skinType: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  const canAccess =
    getAllowedRoles.has(session.user.role) || session.user.id === booking.userId;

  if (!canAccess) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  return Response.json({ diagnosis: booking.diagnosis ?? null });
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!putAllowedRoles.has(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { bookingId } = await context.params;

  if (!bookingId) {
    return Response.json({ error: "Booking ID is required." }, { status: 400 });
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { id: true },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as PutPayload;
  const problemIdentification =
    typeof body.problemIdentification === "string"
      ? body.problemIdentification.trim() || null
      : null;
  const recommendationsInput = normalizeRecommendations(body.productIds);
  const productIds = recommendationsInput.map((item) => item.productId);

  if (productIds.length > 0) {
    const products = await db.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
      },
    });

    const foundIds = new Set(products.map((product) => product.id));
    const missingIds = productIds.filter((productId) => !foundIds.has(productId));

    if (missingIds.length > 0) {
      return Response.json(
        {
          error: "Some products were not found.",
          missingProductIds: missingIds,
        },
        { status: 400 },
      );
    }
  }

  const diagnosis = await db.$transaction(async (tx) => {
    const diagnosisRecord = await tx.diagnosis.upsert({
      where: {
        bookingId,
      },
      update: {
        problemIdentification,
      },
      create: {
        bookingId,
        problemIdentification,
      },
    });

    if (productIds.length === 0) {
      await tx.productRecommendation.deleteMany({
        where: {
          diagnosisId: diagnosisRecord.id,
        },
      });
    } else {
      await tx.productRecommendation.deleteMany({
        where: {
          diagnosisId: diagnosisRecord.id,
          productId: {
            notIn: productIds,
          },
        },
      });

      const existingRecommendations = await tx.productRecommendation.findMany({
        where: {
          diagnosisId: diagnosisRecord.id,
          productId: {
            in: productIds,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const keepers = new Map<string, string>();
      const duplicateIds: string[] = [];

      for (const recommendation of existingRecommendations) {
        if (!keepers.has(recommendation.productId)) {
          keepers.set(recommendation.productId, recommendation.id);
        } else {
          duplicateIds.push(recommendation.id);
        }
      }

      if (duplicateIds.length > 0) {
        await tx.productRecommendation.deleteMany({
          where: {
            id: {
              in: duplicateIds,
            },
          },
        });
      }

      for (const item of recommendationsInput) {
        const existingId = keepers.get(item.productId);

        if (existingId) {
          await tx.productRecommendation.update({
            where: { id: existingId },
            data: {
              note: item.note,
            },
          });
        } else {
          await tx.productRecommendation.create({
            data: {
              diagnosisId: diagnosisRecord.id,
              productId: item.productId,
              note: item.note,
            },
          });
        }
      }
    }

    return tx.diagnosis.findUnique({
      where: {
        id: diagnosisRecord.id,
      },
      include: {
        recommendations: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                type: true,
                price: true,
                skinType: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  });

  return Response.json({ diagnosis });
}
