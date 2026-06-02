import { redirect } from "next/navigation";
import { auth } from "@/auth";
import db from "@/lib/db";

export default async function CrmClientsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "CRM") {
    redirect("/dashboard");
  }

  const clients = await db.user.findMany({
    where: {
      role: "CLIENT",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  return (
    <section className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 rounded-3xl border border-black/10 bg-background p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-3xl font-semibold text-foreground">All Clients</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Review every registered client and their booking totals.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-black/10 bg-background shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <table className="min-w-full divide-y divide-black/10 text-left dark:divide-white/10">
            <thead className="bg-zinc-100 text-sm uppercase tracking-wide text-foreground/60 dark:bg-white/5">
              <tr>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Phone</th>
                <th className="px-4 py-4">Registered</th>
                <th className="px-4 py-4">Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 bg-white text-sm dark:divide-white/10 dark:bg-zinc-900">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-foreground/70">
                    No clients found.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-4 py-4 font-medium text-foreground">{client.name ?? "-"}</td>
                    <td className="px-4 py-4 text-foreground/70">{client.email}</td>
                    <td className="px-4 py-4 text-foreground/70">{client.phone ?? "-"}</td>
                    <td className="px-4 py-4 text-foreground/70">
                      {client.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 text-foreground/70">{client._count.bookings}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
