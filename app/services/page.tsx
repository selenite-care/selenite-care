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
    <section style={{ backgroundColor: "#F8F5F0" }} className="flex flex-1 px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              color: "#2B2B2B",
            }}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Services
          </h1>
          <p style={{ color: "#B8A89A" }} className="mt-4 text-base leading-7">
            Choose the care option that best fits your needs and book a
            consultation in a few simple steps.
          </p>
        </div>

        {isLoading ? (
          <p style={{ color: "#B8A89A" }} className="mt-10 text-sm">Loading services...</p>
        ) : null}

        {error ? <p className="mt-10 text-sm text-red-600">{error}</p> : null}

        {!isLoading && !error && featuredServices.length === 0 ? (
          <p style={{ color: "#B8A89A" }} className="mt-10 text-sm">
            No services are available yet.
          </p>
        ) : null}

        {!isLoading && !error && featuredServices.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredServices.map((service) => (
              <article
                key={service.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#D8C7B5",
                  borderWidth: "1px",
                }}
                className="flex min-h-64 flex-col rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex-1">
                  <h2
                    style={{
                      fontFamily: "Playfair Display, serif",
                      color: "#2B2B2B",
                    }}
                    className="text-lg font-bold"
                  >
                    {service.name}
                  </h2>
                  <p style={{ color: "#B8A89A" }} className="mt-3 text-sm leading-6">
                    {service.description ?? "Personalized wellness support."}
                  </p>
                  <div className="mt-5 flex flex-col gap-2 text-sm">
                    <span style={{ color: "#B8A89A" }}>{service.duration} minutes</span>
                    <span style={{ color: "#C6A56B" }} className="font-semibold">
                      BDT {service.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/booking?serviceId=${service.id}`}
                  style={{
                    backgroundColor: "#2B2B2B",
                    color: "#F8F5F0",
                  }}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors duration-200 hover:bg-[#B8A89A]"
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
