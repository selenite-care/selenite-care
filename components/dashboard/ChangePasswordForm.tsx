"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setIsSaving(true);

    const res = await fetch("/api/client/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "changePassword", currentPassword, newPassword }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Failed to change password.");
      setIsSaving(false);
      return;
    }

    setMessage("Password changed successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <div>
        <label className="text-page block text-sm font-medium">
          Current password
        </label>
        <input
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          type="password"
          required
          className="border-themed bg-card text-page mt-2 h-11 w-full rounded-md border px-3 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
        />
      </div>

      <div>
        <label className="text-page block text-sm font-medium">
          New password
        </label>
        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          required
          minLength={6}
          className="border-themed bg-card text-page mt-2 h-11 w-full rounded-md border px-3 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
        />
      </div>

      {message ? <p className="text-muted text-sm">{message}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--sidebar)] px-3 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:opacity-90 disabled:opacity-70"
      >
        {isSaving ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
}
