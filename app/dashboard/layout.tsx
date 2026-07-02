import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Avatar from "@/components/ui/Avatar";
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
        <div className="flex flex-col items-start">
          <Avatar
            imageUrl={session.user.image ?? null}
            name={session.user.name ?? null}
            size="md"
          />
          <p className="mt-3 text-sm font-bold text-[#2B2B2B] dark:text-[#F0EDE8]">
            {session.user.name ?? "Client"}
          </p>
          <span className="mt-2 inline-flex rounded-full bg-[#B87B68] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2B2B2B]">
            {session.user.role}
          </span>
          <p
            className="mt-6 text-sm font-medium uppercase"
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
