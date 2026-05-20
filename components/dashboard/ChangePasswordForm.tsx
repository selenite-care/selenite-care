"use client";

import { useState } from "react";

export default function ChangePasswordForm() {
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
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <div>
        <label className="block text-sm font-medium text-foreground">Current password</label>
        <input
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          type="password"
          required
          className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">New password</label>
        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          required
          minLength={6}
          className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
        />
      </div>

      {message ? <p className="text-sm text-foreground/70">{message}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-70"
      >
        {isSaving ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
}
