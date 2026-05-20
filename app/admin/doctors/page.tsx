"use client";

import { FormEvent, useEffect, useState } from "react";

type Doctor = {
  id: string;
  name: string;
  designation: string;
  availability: string;
  bio: string | null;
  image: string | null;
  serviceId: string;
};

type ServiceGroup = {
  id: string;
  name: string;
  doctors: Doctor[];
};

type DoctorFormState = {
  name: string;
  designation: string;
  availability: string;
  bio: string;
  serviceId: string;
};

const emptyForm: DoctorFormState = {
  name: "",
  designation: "",
  availability: "",
  bio: "",
  serviceId: "",
};

export default function AdminDoctorsPage() {
  const [services, setServices] = useState<ServiceGroup[]>([]);
  const [form, setForm] = useState<DoctorFormState>(emptyForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadDoctors() {
    setError("");

    try {
      const response = await fetch("/api/admin/doctors");

      if (!response.ok) {
        throw new Error("Unable to load doctors.");
      }

      const data = (await response.json()) as { services?: ServiceGroup[] };
      const nextServices = data.services ?? [];
      setServices(nextServices);
      setForm((current) => ({
        ...current,
        serviceId:
          current.serviceId || nextServices[0]?.id || "",
      }));
    } catch {
      setError("Doctors are not available right now.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialDoctors() {
      try {
        const response = await fetch("/api/admin/doctors");

        if (!response.ok) {
          throw new Error("Unable to load doctors.");
        }

        const data = (await response.json()) as { services?: ServiceGroup[] };
        const nextServices = data.services ?? [];
        setServices(nextServices);
        setForm((current) => ({
          ...current,
          serviceId: nextServices[0]?.id || "",
        }));
      } catch {
        setError("Doctors are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialDoctors();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/doctors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      setError(data?.error ?? "Unable to save doctor.");
      setIsSubmitting(false);
      return;
    }

    setForm((current) => ({
      ...emptyForm,
      serviceId: current.serviceId,
    }));
    setIsSubmitting(false);
    await loadDoctors();
  }

  async function handleDelete(doctorId: string) {
    setError("");

    const response = await fetch("/api/admin/doctors", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: doctorId }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      setError(data?.error ?? "Unable to delete doctor.");
      return;
    }

    await loadDoctors();
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Doctors
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Manage doctors by service and keep availability up to date.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-foreground">
          Add Doctor
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label
                htmlFor="serviceId"
                className="block text-sm font-medium text-foreground"
              >
                Service
              </label>
              <select
                id="serviceId"
                value={form.serviceId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    serviceId: event.target.value,
                  }))
                }
                required
                className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground"
              >
                Name
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
              />
            </div>

            <div>
              <label
                htmlFor="designation"
                className="block text-sm font-medium text-foreground"
              >
                Designation
              </label>
              <input
                id="designation"
                value={form.designation}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    designation: event.target.value,
                  }))
                }
                required
                className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="availability"
              className="block text-sm font-medium text-foreground"
            >
              Availability
            </label>
            <input
              id="availability"
              value={form.availability}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  availability: event.target.value,
                }))
              }
              required
              className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-foreground"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={form.bio}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bio: event.target.value,
                }))
              }
              rows={4}
              className="mt-2 w-full resize-none rounded-md border border-black/10 bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || services.length === 0}
              className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Add Doctor"}
            </button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading doctors...</p>
      ) : null}

      {!isLoading && services.length === 0 ? (
        <p className="text-sm text-foreground/70">
          No services found. Add services before adding doctors.
        </p>
      ) : null}

      {!isLoading && services.length > 0 ? (
        <div className="space-y-6">
          {services.map((service) => (
            <section
              key={service.id}
              className="overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10"
            >
              <div className="border-b border-black/10 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <h2 className="text-lg font-semibold text-foreground">
                  {service.name}
                </h2>
              </div>

              {service.doctors.length === 0 ? (
                <p className="px-4 py-6 text-sm text-foreground/70">
                  No doctors added for this service yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="border-b border-black/10 text-foreground/70 dark:border-white/10">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Designation</th>
                        <th className="px-4 py-3 font-medium">Availability</th>
                        <th className="px-4 py-3 font-medium">Bio</th>
                        <th className="px-4 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {service.doctors.map((doctor) => (
                        <tr
                          key={doctor.id}
                          className="border-b border-black/10 last:border-0 dark:border-white/10"
                        >
                          <td className="px-4 py-4 font-medium text-foreground">
                            {doctor.name}
                          </td>
                          <td className="px-4 py-4 text-foreground/70">
                            {doctor.designation}
                          </td>
                          <td className="px-4 py-4 text-foreground/70">
                            {doctor.availability}
                          </td>
                          <td className="max-w-sm px-4 py-4 text-foreground/70">
                            {doctor.bio ?? "Not provided"}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => handleDelete(doctor.id)}
                              className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}
