"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type AppointmentDoctor = {
  id: string;
  name: string;
  designation: string;
  availability: string;
  bio: string | null;
  image: string | null;
};

type DoctorsResponse = {
  doctors?: AppointmentDoctor[];
  error?: string;
};

type MembershipResponse = {
  membership?: {
    membershipId: string;
    tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
    status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  } | null;
  error?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AppointmentPage() {
  const [membershipStatus, setMembershipStatus] = useState<
    "loading" | "active" | "inactive"
  >("loading");
  const [doctors, setDoctors] = useState<AppointmentDoctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      try {
        const membershipResponse = await fetch("/api/client/membership");
        const membershipData =
          (await membershipResponse.json().catch(() => null)) as
            | MembershipResponse
            | null;

        const hasActiveMembership =
          membershipResponse.ok &&
          membershipData?.membership?.status === "ACTIVE";

        if (!isMounted) {
          return;
        }

        if (!hasActiveMembership) {
          setMembershipStatus("inactive");
          return;
        }

        setMembershipStatus("active");
        setIsLoadingDoctors(true);

        const doctorsResponse = await fetch("/api/appointment/doctors");
        const doctorsData =
          (await doctorsResponse.json().catch(() => null)) as
            | DoctorsResponse
            | null;

        if (!doctorsResponse.ok) {
          throw new Error(doctorsData?.error ?? "Unable to load doctors.");
        }

        if (isMounted) {
          setDoctors(doctorsData?.doctors ?? []);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load appointment details.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingDoctors(false);
          setMembershipStatus((current) =>
            current === "loading" ? "inactive" : current,
          );
        }
      }
    }

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen px-6 py-16" style={{ backgroundColor: "#F8F5F0" }}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <h1
            className="text-4xl font-bold sm:text-5xl"
            style={{
              fontFamily: "Playfair Display, serif",
              color: "#2B2B2B",
            }}
          >
            Book an Appointment
          </h1>

          <p
            className="mt-5 text-base leading-8 sm:text-lg"
            style={{ color: "#6E6257" }}
          >
            Select your preferred doctor to begin your consultation journey.
          </p>
        </div>

        {error ? (
          <div
            className="mt-10 rounded-2xl border px-5 py-4 text-sm text-red-600"
            style={{ borderColor: "#F0C9C9", backgroundColor: "#FFF6F6" }}
          >
            {error}
          </div>
        ) : null}

        {membershipStatus === "loading" ? (
          <p className="mt-10 text-sm" style={{ color: "#B8A89A" }}>
            Checking membership...
          </p>
        ) : null}

        {membershipStatus === "inactive" ? (
          <section
            className="mt-10 rounded-[24px] border px-6 py-10 text-center"
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D8C7B5",
              boxShadow: "0 18px 48px rgba(43, 43, 43, 0.06)",
            }}
          >
            <h2
              className="text-2xl font-semibold"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Active Membership Required
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7" style={{ color: "#6E6257" }}>
              You need an active membership to book an appointment.
            </p>
            <Link
              href="/services"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors hover:bg-[#B8A89A]"
              style={{
                backgroundColor: "#2B2B2B",
                color: "#F8F5F0",
              }}
            >
              Get Membership
            </Link>
          </section>
        ) : null}

        {membershipStatus === "active" ? (
          <>
            {isLoadingDoctors ? (
              <p className="mt-10 text-sm" style={{ color: "#B8A89A" }}>
                Loading doctors...
              </p>
            ) : null}

            {!isLoadingDoctors && doctors.length === 0 ? (
              <p className="mt-10 text-sm" style={{ color: "#B8A89A" }}>
                No doctors are available right now.
              </p>
            ) : null}

            {!isLoadingDoctors && doctors.length > 0 ? (
              <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {doctors.map((doctor) => (
                  <article
                    key={doctor.id}
                    className="overflow-hidden rounded-[20px] border bg-white"
                    style={{
                      borderColor: "#D8C7B5",
                      boxShadow: "0 14px 40px rgba(43, 43, 43, 0.06)",
                    }}
                  >
                    {doctor.image ? (
                      <div className="relative h-64 w-full bg-[#EFE7DC]">
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
                        className="flex h-64 w-full items-center justify-center"
                        style={{ backgroundColor: "#E8DDD3" }}
                      >
                        <span
                          className="text-3xl font-semibold"
                          style={{ color: "#2B2B2B" }}
                        >
                          {getInitials(doctor.name)}
                        </span>
                      </div>
                    )}

                    <div className="p-6">
                      <h2
                        className="text-xl font-semibold"
                        style={{
                          color: "#2B2B2B",
                          fontFamily: "Playfair Display, serif",
                        }}
                      >
                        {doctor.name}
                      </h2>
                      <p className="mt-2 text-sm font-medium" style={{ color: "#8C7967" }}>
                        {doctor.designation}
                      </p>
                      <p className="mt-4 text-sm leading-6" style={{ color: "#6E6257" }}>
                        {doctor.bio ?? "Doctor profile coming soon."}
                      </p>

                      <div
                        className="mt-5 rounded-xl border px-4 py-3 text-sm"
                        style={{
                          borderColor: "#D8C7B5",
                          backgroundColor: "#F8F5F0",
                          color: "#6E6257",
                        }}
                      >
                        <span className="font-medium" style={{ color: "#2B2B2B" }}>
                          Availability:
                        </span>{" "}
                        {doctor.availability}
                      </div>

                      <Link
                        href={`/appointment/survey?doctorId=${encodeURIComponent(doctor.id)}`}
                        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:bg-[#B8A89A]"
                        style={{
                          backgroundColor: "#2B2B2B",
                          color: "#F8F5F0",
                        }}
                      >
                        Select Doctor
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
