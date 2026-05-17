"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Service } from "@/types";

export default function BookingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
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

  return (
    <section className="flex flex-1 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Book an Appointment
          </h1>
          <p className="mt-4 text-base leading-7 text-foreground/70">
            Select a service to begin your booking and continue to payment.
          </p>
        </div>

        {isLoading ? (
          <p className="mt-10 text-sm text-foreground/70">Loading services...</p>
        ) : null}

        {error ? <p className="mt-10 text-sm text-red-600">{error}</p> : null}

        {!isLoading && !error && services.length === 0 ? (
          <p className="mt-10 text-sm text-foreground/70">
            No services are available yet.
          </p>
        ) : null}

        {!isLoading && !error && services.length > 0 ? (
          <>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const isSelected = selectedService?.id === service.id;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className={`min-h-48 rounded-lg border bg-background p-6 text-left transition-colors ${
                      isSelected
                        ? "border-foreground"
                        : "border-black/10 hover:border-foreground/40 dark:border-white/10"
                    }`}
                  >
                    <span className="text-lg font-semibold text-foreground">
                      {service.name}
                    </span>
                    <span className="mt-5 flex flex-wrap gap-3 text-sm text-foreground/70">
                      <span>{service.duration} minutes</span>
                      <span>${service.price.toFixed(2)}</span>
                    </span>
                    <span className="mt-6 block text-sm font-medium text-foreground">
                      {isSelected ? "Selected" : "Select service"}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedService ? (
              <div className="mt-8 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
                <p className="text-sm text-foreground/70">
                  Selected service:{" "}
                  <span className="font-medium text-foreground">
                    {selectedService.name}
                  </span>
                </p>
                <Link
                  href={`/payment?serviceId=${selectedService.id}`}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
                >
                  Proceed to Payment
                </Link>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
