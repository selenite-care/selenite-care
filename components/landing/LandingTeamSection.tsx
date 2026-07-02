"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type LandingDoctor = {
  id: string;
  name: string;
  designation: string;
  image: string | null;
  specialization: "AESTHETICIAN" | "NUTRITIONIST" | "PSYCHIATRIST";
};

type DoctorsResponse = {
  doctors?: LandingDoctor[];
  error?: string;
};

const specializationLabels: Record<LandingDoctor["specialization"], string> = {
  AESTHETICIAN: "Aesthetician",
  NUTRITIONIST: "Nutritionist",
  PSYCHIATRIST: "Psychiatrist",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function LandingTeamSection() {
  const [doctors, setDoctors] = useState<LandingDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDoctors() {
      try {
        const response = await fetch("/api/appointment/doctors", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | DoctorsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load doctors.");
        }

        if (!isMounted) {
          return;
        }

        setDoctors((data?.doctors ?? []).slice(0, 4));
      } catch {
        if (!isMounted) {
          return;
        }

        setDoctors([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDoctors();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mx-auto mt-4 w-full max-w-6xl">
      <div className="rounded-[24px] bg-[#F8F5F0] px-5 py-12 dark:bg-[#141210] sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Our Certified Experts
          </h2>
        </div>

        {isLoading ? (
          <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#EADDCD] bg-white px-4 py-6 text-center dark:border-[#3D3530] dark:bg-[#242220]"
              >
                <div className="mx-auto h-[100px] w-[100px] animate-pulse rounded-full bg-[#EFE7DC] dark:bg-[#1A1814]" />
                <div className="mx-auto mt-4 h-5 w-24 animate-pulse rounded bg-[#EFE7DC] dark:bg-[#1A1814]" />
                <div className="mx-auto mt-3 h-4 w-20 animate-pulse rounded bg-[#EFE7DC] dark:bg-[#1A1814]" />
                <div className="mx-auto mt-4 h-7 w-24 animate-pulse rounded-full bg-[#EFE7DC] dark:bg-[#1A1814]" />
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <p className="mt-10 text-center text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
            Our expert team is ready to help you.
          </p>
        ) : (
          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-5 lg:grid-cols-4">
            {doctors.map((doctor) => (
              <article
                key={doctor.id}
                className="rounded-2xl border border-[#EADDCD] bg-white px-4 py-6 text-center dark:border-[#3D3530] dark:bg-[#242220]"
              >
                {doctor.image ? (
                  <div className="relative mx-auto h-[100px] w-[100px] overflow-hidden rounded-full">
                    <Image
                      src={doctor.image}
                      alt={doctor.name}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="mx-auto flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#EFE7DC] dark:bg-[#1A1814]">
                    <span
                      className="text-2xl font-semibold text-[#B87B68]"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      {getInitials(doctor.name)}
                    </span>
                  </div>
                )}

                <h3 className="mt-4 text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {doctor.name}
                </h3>
                <p className="mt-2 text-sm text-[#884F38] dark:text-[#8A7D75]">
                  {doctor.designation}
                </p>
                <span className="mt-4 inline-flex rounded-full bg-[#F8F5F0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B87B68] dark:bg-[#1A1814] dark:text-[#D4B47A]">
                  {specializationLabels[doctor.specialization]}
                </span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
