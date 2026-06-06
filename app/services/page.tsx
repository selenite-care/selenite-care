import { db } from "@/lib/db";
import ServicesClient from "./ServicesClient";
import type { ServicesClientService } from "./ServicesClient";

export const dynamic = "force-dynamic";

const featuredServiceNames = [
  "Standard Consultation",
  "Premium Consultation",
  "Student Consultation",
  "Online Consultation",
] as const;

export default async function ServicesPage() {
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

  const featuredServices = featuredServiceNames
    .map((name) => services.find((service) => service.name === name))
    .filter((service): service is ServicesClientService => Boolean(service));

  return <ServicesClient services={featuredServices} />;
}
