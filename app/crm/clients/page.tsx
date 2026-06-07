import { redirect } from "next/navigation";
import { auth } from "@/auth";
import db from "@/lib/db";
import CrmClientsClient from "./CrmClientsClient";

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

  const clientItems = clients.map((client) => ({
    ...client,
    createdAt: client.createdAt.toISOString(),
  }));

  return (
    <section className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 rounded-3xl border border-black/10 bg-background p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-3xl font-semibold text-foreground">All Clients</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Review every registered client and their booking totals.
          </p>
        </div>

        <CrmClientsClient clients={clientItems} />
      </div>
    </section>
  );
}
