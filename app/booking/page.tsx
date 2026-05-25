"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

export default function BookingPage() {
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
    <section className="flex flex-1 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {service?.name ?? "Book an Appointment"}
          </h1>
          <p className="mt-4 text-base leading-7 text-foreground/70">
            Choose a doctor for this service and continue to the consultation
            survey.
          </p>
        </div>

        {isLoading ? (
          <p className="mt-10 text-sm text-foreground/70">Loading doctors...</p>
        ) : null}

        {error ? <p className="mt-10 text-sm text-red-600">{error}</p> : null}

        {!isLoading && !error && doctors.length === 0 ? (
          <p className="mt-10 text-sm text-foreground/70">
            No doctors are available for this service right now.
          </p>
        ) : null}

        {!isLoading && !error && doctors.length > 0 ? (
          <>
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {doctors.map((doctor) => {
                const isSelected = selectedDoctor?.id === doctor.id;

                return (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`overflow-hidden rounded-lg border-2 bg-background text-left transition-all ${
                      isSelected
                        ? "border-foreground shadow-sm ring-1 ring-foreground/10"
                        : "border-black/10 hover:border-foreground/40 dark:border-white/10"
                    }`}
                  >
                    {doctor.image ? (
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                        <Image
                          src={doctor.image}
                          alt={doctor.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] w-full items-center justify-center bg-zinc-200 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        No image available
                      </div>
                    )}

                    <div className="p-6">
                      <span className="text-lg font-semibold text-foreground">
                        {doctor.name}
                      </span>
                      <span className="mt-2 block text-sm font-medium text-foreground/70">
                        {doctor.designation}
                      </span>
                      <span className="mt-4 block text-sm text-foreground/70">
                        {doctor.availability}
                      </span>
                      <p className="mt-4 text-sm leading-6 text-foreground/70">
                        {doctor.bio ?? "Doctor profile coming soon."}
                      </p>
                      <span className="mt-6 block text-sm font-medium text-foreground">
                        {isSelected ? "Selected" : "Select doctor"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedDoctor ? (
              <div className="mt-8 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
                <p className="text-sm text-foreground/70">
                  Selected doctor:{" "}
                  <span className="font-medium text-foreground">
                    {selectedDoctor.name}
                  </span>
                </p>
                <Link
                  href={`/booking/survey?serviceId=${encodeURIComponent(serviceId)}&doctorId=${encodeURIComponent(selectedDoctor.id)}`}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
                >
                  Proceed to Survey
                </Link>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
