"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Service } from "@/types";

const featuredServiceNames = [
  "Standard Consultation",
  "Premium Consultation",
  "Student Consultation",
  "Online Consultation",
] as const;

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch("/api/services");

        if (!response.ok) {
          throw new Error("Unable to load services.");
        }

        const data = (await response.json()) as { services?: Service[] };
        setServices(data.services ?? []);
      } catch {
        setError("Services are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadServices();
  }, []);

  const featuredServices = featuredServiceNames
    .map((name) => services.find((service) => service.name === name))
    .filter((service): service is Service => Boolean(service));

  return (
    <section className="flex flex-1 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Services
          </h1>
          <p className="mt-4 text-base leading-7 text-foreground/70">
            Choose the care option that best fits your needs and book a
            consultation in a few simple steps.
          </p>
        </div>

        {isLoading ? (
          <p className="mt-10 text-sm text-foreground/70">Loading services...</p>
        ) : null}

        {error ? <p className="mt-10 text-sm text-red-600">{error}</p> : null}

        {!isLoading && !error && featuredServices.length === 0 ? (
          <p className="mt-10 text-sm text-foreground/70">
            No services are available yet.
          </p>
        ) : null}

        {!isLoading && !error && featuredServices.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredServices.map((service) => (
              <article
                key={service.id}
                className="flex min-h-64 flex-col rounded-lg border border-black/10 bg-background p-6 dark:border-white/10"
              >
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    {service.name}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-foreground/70">
                    {service.description ?? "Personalized wellness support."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm text-foreground/70">
                    <span>{service.duration} minutes</span>
                    <span>BDT{service.price.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  href={`/booking?serviceId=${service.id}`}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
                >
                  Book Now
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
