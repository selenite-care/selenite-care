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
  specialization: "AESTHETICIAN" | "NUTRITIONIST" | "PSYCHIATRIST";
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
    expiresAt: string | null;
  } | null;
  error?: string;
};

const specializationOrder = [
  "AESTHETICIAN",
  "NUTRITIONIST",
  "PSYCHIATRIST",
] as const;

const specializationLabels: Record<(typeof specializationOrder)[number], string> = {
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

export default function AppointmentPage() {
  const [membershipStatus, setMembershipStatus] = useState<
    "loading" | "active" | "inactive" | "expired"
  >("loading");
  const [doctors, setDoctors] = useState<AppointmentDoctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [error, setError] = useState("");
  const [showMembershipModal, setShowMembershipModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      try {
        const membershipResponse = await fetch("/api/client/membership");
        const membershipData =
          (await membershipResponse.json().catch(() => null)) as
            | MembershipResponse
            | null;

        const membership = membershipData?.membership;
        const hasActiveMembership =
          membershipResponse.ok &&
          membership?.status === "ACTIVE" &&
          !!membership.expiresAt &&
          new Date(membership.expiresAt).getTime() > Date.now();

        if (!isMounted) {
          return;
        }

        if (hasActiveMembership) {
          setMembershipStatus("active");
        } else if (
          membershipResponse.ok &&
          membership &&
          (membership.status === "EXPIRED" ||
            (membership.status === "ACTIVE" &&
              (!membership.expiresAt ||
                new Date(membership.expiresAt).getTime() <= Date.now())))
        ) {
          setMembershipStatus("expired");
        } else {
          setMembershipStatus("inactive");
        }

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

  const hasActiveMembership = membershipStatus === "active";
  const membershipPromptMessage =
    membershipStatus === "expired"
      ? "Your membership has expired. Please renew your membership to book appointments."
      : "Please purchase a membership first.";
  const doctorsBySpecialization = specializationOrder
    .map((specialization) => ({
      specialization,
      label: specializationLabels[specialization],
      doctors: doctors.filter((doctor) => doctor.specialization === specialization),
    }))
    .filter((group) => group.doctors.length > 0);

  return (
    <main className="min-h-screen bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <h1
            className="text-4xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Book an Appointment
          </h1>

          <p
            className="mt-5 text-base leading-8 text-[#6E6257] dark:text-[#8A7D75] sm:text-lg"
          >
            Select your preferred doctor to begin your consultation journey.
          </p>
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {membershipStatus === "loading" ? (
          <p className="mt-10 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
            Checking membership...
          </p>
        ) : null}

        {membershipStatus === "inactive" || membershipStatus === "expired" ? (
          <section
            className="mt-10 rounded-[24px] border bg-white px-6 py-8 text-center dark:bg-[#242220] dark:border-[#3D3530]"
            style={{
              boxShadow: "0 18px 48px rgba(43, 43, 43, 0.06)",
            }}
          >
            <h2
              className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{
                fontFamily: "Playfair Display, serif",
              }}
            >
              Active Membership Required
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6E6257] dark:text-[#8A7D75]">
              {membershipStatus === "expired"
                ? "Your membership has expired. Please renew your membership to book appointments."
                : "You can browse our doctors below, but you will need an active membership before selecting one for an appointment."}
            </p>
            <Link
              href="/services"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:bg-[#B8A89A]"
              style={{
                backgroundColor: "#2B2B2B",
                color: "#F8F5F0",
              }}
            >
              Get Membership
            </Link>
          </section>
        ) : null}

        {membershipStatus !== "loading" ? (
          <>
            {isLoadingDoctors ? (
              <p className="mt-10 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
                Loading doctors...
              </p>
            ) : null}

            {!isLoadingDoctors && doctors.length === 0 ? (
              <p className="mt-10 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
                No doctors are available right now.
              </p>
            ) : null}

            {!isLoadingDoctors && doctors.length > 0 ? (
              <div className="mt-12 space-y-10">
                {doctorsBySpecialization.map((group) => (
                  <section key={group.specialization}>
                    <div className="flex items-center gap-4">
                      <div
                        className="h-px flex-1"
                        style={{ backgroundColor: "#D8C7B5" }}
                      />
                      <h2
                        className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                        style={{
                          fontFamily: "Playfair Display, serif",
                        }}
                      >
                        {group.label}
                      </h2>
                      <div
                        className="h-px flex-1"
                        style={{ backgroundColor: "#D8C7B5" }}
                      />
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                      {group.doctors.map((doctor) => {
                        const isLocked = !hasActiveMembership;
                        const lockMessage = !hasActiveMembership
                          ? membershipPromptMessage
                          : "";

                        return (
                          <article
                            key={doctor.id}
                            className={`relative overflow-hidden rounded-[20px] border bg-white dark:bg-[#242220] dark:border-[#3D3530] ${
                              isLocked ? "opacity-70" : ""
                            }`}
                            style={{
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
                                  className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                                >
                                  {getInitials(doctor.name)}
                                </span>
                              </div>
                            )}

                            <div className="p-6">
                              {isLocked ? (
                                <div
                                  className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
                                  style={{
                                    borderColor: "#D8C7B5",
                                    backgroundColor: "#F8F5F0",
                                    color: "#8C7967",
                                  }}
                                >
                                  Locked
                                </div>
                              ) : null}

                              <h3
                                className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                                style={{
                                  fontFamily: "Playfair Display, serif",
                                }}
                              >
                                {doctor.name}
                              </h3>
                              <p className="mt-2 text-sm font-medium text-[#8C7967] dark:text-[#8A7D75]">
                                {doctor.designation}
                              </p>
                              <p className="mt-4 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]">
                                {doctor.bio ?? "Doctor profile coming soon."}
                              </p>

                              <div
                                className="mt-5 rounded-xl border px-4 py-3 text-sm dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
                                style={{
                                  borderColor: "#D8C7B5",
                                  backgroundColor: "#F8F5F0",
                                  color: "#6E6257",
                                }}
                              >
                                <span className="font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                                  Availability:
                                </span>{" "}
                                {doctor.availability}
                              </div>

                              {isLocked ? (
                                <>
                                  <p
                                    className="mt-5 text-sm leading-6 text-[#8C7967] dark:text-[#8A7D75]"
                                  >
                                    {lockMessage}
                                  </p>

                                  {!hasActiveMembership ? (
                                    <button
                                      type="button"
                                      onClick={() => setShowMembershipModal(true)}
                                      className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:bg-[#B8A89A]"
                                      style={{
                                        backgroundColor: "#2B2B2B",
                                        color: "#F8F5F0",
                                      }}
                                      >
                                        Select Doctor
                                      </button>
                                  ) : null}
                                </>
                              ) : (
                                <Link
                                  href={`/appointment/date?doctorId=${encodeURIComponent(doctor.id)}`}
                                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:bg-[#B8A89A]"
                                  style={{
                                    backgroundColor: "#2B2B2B",
                                    color: "#F8F5F0",
                                  }}
                                >
                                  Select Doctor
                                </Link>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {showMembershipModal ? (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
          onClick={() => setShowMembershipModal(false)}
        >
          <div
            className="modal-card w-full max-w-md rounded-[24px] border bg-white p-6 shadow-2xl"
            style={{ borderColor: "#D8C7B5" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  Membership Required
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                  {membershipPromptMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMembershipModal(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-[#F8F5F0] text-lg text-[#2B2B2B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                style={{
                  borderColor: "#D8C7B5",
                }}
                aria-label="Close membership prompt"
              >
                ×
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/services"
                className="inline-flex h-12 flex-1 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:bg-[#B8A89A]"
                style={{
                  backgroundColor: "#2B2B2B",
                  color: "#F8F5F0",
                }}
              >
                Get Membership
              </Link>
              <button
                type="button"
                onClick={() => setShowMembershipModal(false)}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-md border bg-[#F8F5F0] px-5 text-sm font-medium text-[#2B2B2B] transition-colors dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                style={{
                  borderColor: "#D8C7B5",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
