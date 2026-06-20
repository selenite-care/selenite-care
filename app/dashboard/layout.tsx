import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardMobileNav, DashboardSidebarNav } from "./DashboardNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="bg-page flex flex-1">
      <aside className="bg-sidebar-themed text-sidebar-themed hidden w-72 px-6 py-8 md:block">
        <div>
          <p
            className="text-sm font-medium uppercase"
            style={{ color: "var(--muted)" }}
          >
            Dashboard
          </p>
          <h1
            className="mt-2 text-xl font-semibold tracking-tight"
            style={{ color: "var(--sidebar-text)" }}
          >
            Selenite Care
          </h1>
        </div>

        <DashboardSidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="bg-page flex-1 px-6 py-8 pb-24 md:pb-8">
          {children}
        </main>
        <DashboardMobileNav />
      </div>
    </div>
  );
}
