"use client";

import { useState } from "react";

export default function ProfileEditForm({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setIsSaving(true);

    const res = await fetch("/api/client/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Failed to update name.");
      setIsSaving(false);
      return;
    }

    setMessage("Name updated.");
    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-page block text-sm font-medium">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
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
