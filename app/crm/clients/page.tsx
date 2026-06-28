import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CrmClientsClient from "./CrmClientsClient";

export default async function CrmClientsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "CRM") {
    redirect("/dashboard");
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

        <CrmClientsClient />
      </div>
    </section>
  );
}
