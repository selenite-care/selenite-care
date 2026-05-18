"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Service } from "@/types";

type ServiceFormState = {
  name: string;
  description: string;
  duration: string;
  price: string;
};

const emptyForm: ServiceFormState = {
  name: "",
  description: "",
  duration: "",
  price: "",
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadServices() {
    setError("");

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

  useEffect(() => {
    async function loadInitialServices() {
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

    loadInitialServices();
  }, []);

  function openCreateModal() {
    setEditingService(null);
    setForm(emptyForm);
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description ?? "",
      duration: String(service.duration),
      price: String(service.price),
    });
    setError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description,
      duration: Number(form.duration),
      price: Number(form.price),
    };

    const response = await fetch("/api/admin/services", {
      method: editingService ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        editingService ? { ...payload, id: editingService.id } : payload,
      ),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      setError(data?.error ?? "Unable to save service.");
      setIsSubmitting(false);
      return;
    }

    setIsModalOpen(false);
    setIsSubmitting(false);
    await loadServices();
  }

  async function handleDelete(serviceId: string) {
    setError("");

    const response = await fetch("/api/admin/services", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: serviceId }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      setError(data?.error ?? "Unable to delete service.");
      return;
    }

    await loadServices();
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Services Management
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Add, update, and remove consultation services.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
        >
          Add Service
        </button>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-foreground/70">Loading services...</p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && services.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/70">
          No services found.
        </p>
      ) : null}

      {!isLoading && services.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-black/10 last:border-0 dark:border-white/10"
                  >
                    <td className="px-4 py-4 font-medium text-foreground">
                      {service.name}
                    </td>
                    <td className="max-w-sm px-4 py-4 text-foreground/70">
                      {service.description ?? "Not provided"}
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      {service.duration} minutes
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      ${service.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(service)}
                          className="inline-flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(service.id)}
                          className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {editingService ? "Edit Service" : "Add Service"}
                </h2>
                <p className="mt-2 text-sm text-foreground/70">
                  Enter the details clients will see when choosing a service.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                  htmlFor="description"
                  className="block text-sm font-medium text-foreground"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="mt-2 w-full resize-none rounded-md border border-black/10 bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="duration"
                    className="block text-sm font-medium text-foreground"
                  >
                    Duration
                  </label>
                  <input
                    id="duration"
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        duration: event.target.value,
                      }))
                    }
                    required
                    className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-foreground"
                  >
                    Price
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    required
                    className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-black/10 px-5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
