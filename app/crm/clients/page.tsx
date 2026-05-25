type CrmClient = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  _count: {
    bookings: number;
  };
};

type CrmClientsResponse = {
  clients: CrmClient[];
  error?: string;
};

export default async function CrmClientsPage() {
  const response = await fetch("/api/crm/clients", { cache: "no-store" });
  const data = (await response.json()) as CrmClientsResponse;

  if (!response.ok) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700 dark:border-red-700/40 dark:bg-red-950/40">
          <h1 className="text-2xl font-semibold">Unable to load clients</h1>
          <p className="mt-4 text-sm text-current/70">
            {data.error ?? "An error occurred while fetching client data."}
          </p>
        </div>
      </section>
    );
  }

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
              {data.clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-foreground/70">
                    No clients found.
                  </td>
                </tr>
              ) : (
                data.clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-4 py-4 font-medium text-foreground">{client.name ?? "—"}</td>
                    <td className="px-4 py-4 text-foreground/70">{client.email}</td>
                    <td className="px-4 py-4 text-foreground/70">{client.phone ?? "—"}</td>
                    <td className="px-4 py-4 text-foreground/70">
                      {new Date(client.createdAt).toLocaleDateString("en-US", {
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
