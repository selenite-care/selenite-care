import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

type CreateIntentPayload = {
  serviceId?: unknown;
};

const BDT_PER_USD = 123;

export async function POST(request: Request) {
  const body = (await request.json()) as CreateIntentPayload;
  const serviceId = typeof body.serviceId === "string" ? body.serviceId : "";

  if (!serviceId) {
    return Response.json({ error: "Service ID is required." }, { status: 400 });
  }

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      name: true,
      price: true,
    },
  });

  if (!service) {
    return Response.json({ error: "Service not found." }, { status: 404 });
  }

  const amountInUsdCents = Math.round((service.price / BDT_PER_USD) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInUsdCents,
    currency: "usd",
    metadata: {
      serviceId: service.id,
      serviceName: service.name,
    },
  });

  return Response.json({ clientSecret: paymentIntent.client_secret });
}
