"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  _count: {
    bookings: number;
  };
};

const ROLES = ["CLIENT", "DOCTOR", "CRM", "ADMIN"];
const ROLE_FILTERS = ["All", "CLIENT", "DOCTOR", "CRM", "ADMIN"] as const;

const roleColors: Record<string, { badge: string; text: string }> = {
  CLIENT: { badge: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-800 dark:text-blue-300" },
  DOCTOR: { badge: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-800 dark:text-purple-300" },
  CRM: { badge: "bg-emerald-100 dark:bg-emerald-900/20", text: "text-emerald-800 dark:text-emerald-300" },
  ADMIN: { badge: "bg-red-100 dark:bg-red-900/20", text: "text-red-800 dark:text-red-300" },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<(typeof ROLE_FILTERS)[number]>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch("/api/admin/users");

        if (!response.ok) {
          throw new Error("Unable to load users.");
        }

        const data = (await response.json()) as { users?: AdminUser[] };
        setUsers(data.users ?? []);
      } catch {
        setError("Users are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []);

  async function handleRoleChange(userId: string, newRole: string) {
    if (updatingId) return; // Prevent concurrent updates

    setUpdatingId(userId);
    setUpdateError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to update user role.");
      }

      const data = (await response.json()) as { user?: AdminUser };
      if (data.user) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userId ? data.user! : u))
        );
      }
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update user role.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedQuery ||
        (user.name ?? "").toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        (user.phone ?? "").toLowerCase().includes(normalizedQuery);
      const matchesRole = roleFilter === "All" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchQuery, users]);

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredUsers.map((user) => ({
        Name: user.name ?? "",
        Email: user.email,
        Phone: user.phone ?? "",
        Role: user.role,
        "Registration Date": new Date(user.createdAt).toLocaleDateString(),
        "Total Bookings": user._count.bookings,
      })),
      {
        columns: [
          "Name",
          "Email",
          "Phone",
          "Role",
          "Registration Date",
          "Total Bookings",
        ],
      },
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "selenite-care-clients.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          All Users
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          View registered users and their booking activity.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-foreground/70">Loading users...</p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {updateError ? (
        <p className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {updateError}
        </p>
      ) : null}

      {!isLoading && !error && users.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/70">No users found.</p>
      ) : null}

      {!isLoading && !error && users.length > 0 ? (
        <>
          <div className="mt-8 rounded-lg border border-[#D8C7B5] bg-white p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
              <div>
                <label
                  htmlFor="user-search"
                  className="text-sm font-medium text-[#2B2B2B]"
                >
                  Search users
                </label>
                <input
                  id="user-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Name, email, or phone number"
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                />
              </div>

              <div>
                <label
                  htmlFor="role-filter"
                  className="text-sm font-medium text-[#2B2B2B]"
                >
                  Role
                </label>
                <select
                  id="role-filter"
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(
                      event.target.value as (typeof ROLE_FILTERS)[number],
                    )
                  }
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                >
                  {ROLE_FILTERS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredUsers.length === 0}
                className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: "#2B2B2B",
                  color: "#F8F5F0",
                }}
              >
                Export CSV
              </button>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="mt-8 text-sm text-foreground/70">
              No users match your filters.
            </p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Registration Date</th>
                      <th className="px-4 py-3 font-medium">Total Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const colors = roleColors[user.role] || roleColors.CLIENT;
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-black/10 last:border-0 dark:border-white/10"
                        >
                          <td className="px-4 py-4 text-foreground">
                            {user.name ?? "Not set"}
                          </td>
                          <td className="px-4 py-4 text-foreground/70">
                            {user.email}
                          </td>
                          <td className="px-4 py-4 text-foreground/70">
                            {user.phone ?? "Not set"}
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                handleRoleChange(user.id, e.target.value)
                              }
                              disabled={updatingId === user.id}
                              className={`rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors ${colors.badge} ${colors.text} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-4 text-foreground/70">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-foreground/70">
                            {user._count.bookings}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
