"use client";

import Link from "next/link";
import { useState } from "react";
import DoctorMascot from "@/components/ui/DoctorMascot";

export type ServicesClientService = {
  id: string;
  name: string;
  description: string | null;
  details: string | null;
  price: number;
  originalPrice: number | null;
};

type ServicesClientProps = {
  services: ServicesClientService[];
};

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

export default function ServicesClient({ services }: ServicesClientProps) {
  const [selectedService, setSelectedService] =
    useState<ServicesClientService | null>(null);

  return (
    <section
      style={{ backgroundColor: "#F8F5F0" }}
      className="flex flex-1 px-6 py-16"
    >
    <div className="relative w-full">
    <div className="mx-auto w-full max-w-7xl">
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

        {services.length === 0 ? (
          <p style={{ color: "#B8A89A" }} className="mt-10 text-sm">
            No services are available yet.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => (
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
                  <div className="mt-5 flex items-center gap-3 text-sm">
                    {service.originalPrice ? (
                      <span
                        style={{ color: "#B8A89A" }}
                        className="line-through"
                      >
                        {formatBdt(service.originalPrice)}
                      </span>
                    ) : null}
                    <span style={{ color: "#C6A56B" }} className="font-semibold">
                      {formatBdt(service.price)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedService(service)}
                    style={{
                      borderColor: "#C6A56B",
                      color: "#2B2B2B",
                    }}
                    className="inline-flex h-12 w-full items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors duration-200 hover:bg-[#D8C7B5] md:h-11"
                  >
                    View Details
                  </button>

                  <Link
                    href={`/booking?serviceId=${service.id}`}
                    style={{
                      backgroundColor: "#2B2B2B",
                      color: "#F8F5F0",
                    }}
                    className="inline-flex h-12 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition-colors duration-200 hover:bg-[#B8A89A] md:h-11"
                  >
                    Book Now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedService ? (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center p-0 sm:items-center sm:px-4 sm:py-6"
          style={{ backgroundColor: "rgba(43, 43, 43, 0.72)" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-details-title"
            className="relative h-full w-full overflow-y-auto border p-6 pt-20 shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-lg sm:pt-6"
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D8C7B5",
              boxShadow: "0 24px 80px rgba(43, 43, 43, 0.28)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="service-details-title"
                  className="text-2xl font-bold"
                  style={{
                    color: "#2B2B2B",
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  {selectedService.name}
                </h2>
                <div className="mt-4 flex items-center gap-3 text-sm">
                  {selectedService.originalPrice ? (
                    <span
                      style={{ color: "#B8A89A" }}
                      className="line-through"
                    >
                      {formatBdt(selectedService.originalPrice)}
                    </span>
                  ) : null}
                  <span
                    style={{ color: "#C6A56B" }}
                    className="text-lg font-semibold"
                  >
                    {formatBdt(selectedService.price)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="fixed right-4 top-4 z-10 rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-[#F8F5F0] sm:static sm:border-0 sm:px-3 sm:shadow-none"
                style={{ color: "#2B2B2B", borderColor: "#D8C7B5", backgroundColor: "#FFFFFF" }}
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "#2B2B2B" }}
                >
                  Details
                </p>
                <p
                  className="mt-2 text-sm leading-6"
                  style={{ color: "#B8A89A" }}
                >
                  {selectedService.details ??
                    selectedService.description ??
                    "More details will be available soon."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div className="hidden 2xl:block absolute right-[-130px] top-[-30px]">
    <DoctorMascot />
      </div>
      </div>
    </section>
  );
}
