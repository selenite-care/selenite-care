"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { Service } from "@/types";

type Doctor = {
  id: string;
  name: string;
  designation: string;
  bio: string | null;
  availability: string;
  image: string | null;
  serviceId: string;
};

type DoctorsResponse = {
  service?: Service;
  doctors?: Doctor[];
  error?: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function BookingPageContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId") ?? "";
  const [service, setService] = useState<Service | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDoctors() {
      if (!serviceId) {
        setError("Service ID is required to continue booking.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/services/${serviceId}/doctors`);

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | DoctorsResponse
            | null;
          throw new Error(data?.error ?? "Unable to load doctors.");
        }

        const data = (await response.json()) as DoctorsResponse;
        setService(data.service ?? null);
        setDoctors(data.doctors ?? []);
      } catch {
        setError("Doctors are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDoctors();
  }, [serviceId]);

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
            {service?.name ?? "Book an Appointment"}
          </h1>
          <p style={{ color: "#B8A89A" }} className="mt-4 text-base leading-7">
            Choose a doctor for this service and continue to the consultation
            survey.
          </p>
        </div>

        {isLoading ? (
          <p style={{ color: "#B8A89A" }} className="mt-10 text-sm">Loading doctors...</p>
        ) : null}

        {error ? <p className="mt-10 text-sm text-red-600">{error}</p> : null}

        {!isLoading && !error && doctors.length === 0 ? (
          <p style={{ color: "#B8A89A" }} className="mt-10 text-sm">
            No doctors are available for this service right now.
          </p>
        ) : null}

        {!isLoading && !error && doctors.length > 0 ? (
          <>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {doctors.map((doctor) => {
                const isSelected = selectedDoctor?.id === doctor.id;

                return (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => setSelectedDoctor(doctor)}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderColor: isSelected ? "#C6A56B" : "#D8C7B5",
                      borderWidth: "2px",
                      boxShadow: isSelected
                        ? "0 0 0 3px rgba(198, 165, 107, 0.1)"
                        : "none",
                    }}
                    className="overflow-hidden rounded-xl text-left transition-all duration-200"
                  >
                    {doctor.image ? (
                      <div className="relative h-64 w-full overflow-hidden bg-zinc-100 sm:h-72 md:h-64">
                        <Image
                          src={doctor.image}
                          alt={doctor.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        style={{ backgroundColor: "#E8DDD3" }}
                        className="flex h-64 w-full items-center justify-center sm:h-72 md:h-64"
                      >
                        <span
                          style={{ color: "#2B2B2B" }}
                          className="text-3xl font-semibold"
                        >
                          {getInitials(doctor.name)}
                        </span>
                      </div>
                    )}

                    <div className="p-6">
                      <h2
                        style={{
                          fontFamily: "Playfair Display, serif",
                          color: "#2B2B2B",
                        }}
                        className="text-lg font-bold"
                      >
                        {doctor.name}
                      </h2>
                      <span style={{ color: "#B8A89A" }} className="mt-2 block text-sm font-medium">
                        {doctor.designation}
                      </span>
                      <div style={{ color: "#B8A89A" }} className="mt-4 flex items-center gap-2 text-sm">
                        <span style={{ color: "#C6A56B", fontSize: "16px" }}>📅</span>
                        <span>{doctor.availability}</span>
                      </div>
                      <p style={{ color: "#B8A89A" }} className="mt-4 text-sm leading-6">
                        {doctor.bio ?? "Doctor profile coming soon."}
                      </p>
                      <span style={{ color: "#2B2B2B" }} className="mt-6 block text-sm font-medium">
                        {isSelected ? "✓ Selected" : "Select doctor"}
                      </span>
                      {isSelected ? (
                        <Link
                          href={`/booking/slots?serviceId=${encodeURIComponent(serviceId)}&doctorId=${encodeURIComponent(doctor.id)}`}
                          style={{
                            backgroundColor: "#2B2B2B",
                            color: "#F8F5F0",
                          }}
                          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors duration-200 hover:bg-[#B8A89A] md:h-11"
                        >
                          Proceed to Survey
                        </Link>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

          </>
        ) : null}
      </div>
    </section>
  );
}

function BookingLoadingFallback() {
  return (
    <section
      className="flex min-h-screen flex-col px-6 py-16"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-sm" style={{ color: "#B8A89A" }}>
          Loading...
        </p>
      </div>
    </section>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingLoadingFallback />}>
      <BookingPageContent />
    </Suspense>
  );
}
