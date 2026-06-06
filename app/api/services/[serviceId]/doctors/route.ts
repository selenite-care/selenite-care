import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    serviceId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { serviceId } = await context.params;

  if (!serviceId) {
    return Response.json(
      { error: "Service ID is required." },
      { status: 400 },
    );
  }

  const service = await db.service.findUnique({
    where: {
      id: serviceId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      doctors: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!service) {
    return Response.json({ error: "Service not found." }, { status: 404 });
  }

  return Response.json({
    service: {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
    },
    doctors: service.doctors,
  });
}
