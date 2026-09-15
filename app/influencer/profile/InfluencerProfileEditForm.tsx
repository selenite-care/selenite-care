"use client";

import { useState } from "react";

type ProfileResponse = {
  user?: {
    name: string | null;
    phone: string | null;
  };
  error?: string;
};

export default function InfluencerProfileEditForm({
  currentName,
  currentPhone,
}: {
  currentName: string;
  currentPhone: string;
}) {
  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | ProfileResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update profile.");
      }

      setName(data?.user?.name ?? name);
      setPhone(data?.user?.phone ?? phone);
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-page block text-sm font-medium">Name</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="border-themed bg-card text-page mt-2 h-11 w-full rounded-md border px-3 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
        />
      </div>

      <div>
        <label className="text-page block text-sm font-medium">Phone</label>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          className="border-themed bg-card text-page mt-2 h-11 w-full rounded-md border px-3 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
        />
      </div>

      {message ? <p className="text-muted text-sm">{message}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--sidebar)] px-3 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90 disabled:opacity-70"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
