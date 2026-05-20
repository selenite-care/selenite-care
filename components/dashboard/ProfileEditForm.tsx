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
        <label className="block text-sm font-medium text-foreground">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
        />
      </div>

      {message ? <p className="text-sm text-foreground/70">{message}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-70"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
