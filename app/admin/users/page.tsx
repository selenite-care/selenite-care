"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    bookings: number;
  };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

      {!isLoading && !error && users.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/70">No users found.</p>
      ) : null}

      {!isLoading && !error && users.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Registration Date</th>
                  <th className="px-4 py-3 font-medium">Total Bookings</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
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
                      {user.role}
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      {user._count.bookings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
