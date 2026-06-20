import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminMobileNav, AdminSidebarNav } from "./AdminNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="bg-page flex flex-1">
      <aside className="bg-sidebar-themed text-sidebar-themed hidden w-72 px-6 py-8 md:block">
        <div>
          <p className="text-sm font-medium uppercase text-[var(--muted)]">
            Admin
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--sidebar-text)]">
            Selenite Care
          </h1>
        </div>

        <AdminSidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="bg-sidebar-themed text-sidebar-themed flex items-center justify-between px-6 py-4 md:hidden">
          <p className="text-sm font-medium text-[var(--sidebar-text)]">
            Admin
          </p>
          <AdminMobileNav />
        </div>

        <main className="admin-main bg-page flex-1 px-6 py-8 [&_thead]:bg-[#D8C7B5] [&_thead]:text-[#2B2B2B] [&_thead_th]:text-[#2B2B2B] [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[#C6A56B]/10">
          <style>{`
            .admin-main table thead {
              background-color: #D8C7B5;
              color: #2B2B2B;
            }

            .admin-main table thead th {
              color: #2B2B2B;
            }

            .admin-main table tbody tr {
              transition: background-color 160ms ease, color 160ms ease;
            }

            .admin-main table tbody tr:hover {
              background-color: rgba(198, 165, 107, 0.14);
              color: #2B2B2B;
            }

            .admin-main .bg-foreground {
              background-color: #2B2B2B !important;
              color: #F8F5F0 !important;
            }

            .admin-main .hover\\:bg-foreground\\/85:hover {
              background-color: rgba(43, 43, 43, 0.85) !important;
            }

            .admin-main button.border-black\\/10,
            .admin-main a.border-black\\/10 {
              border-color: #C6A56B !important;
              color: #2B2B2B !important;
            }

            .admin-main button.border-black\\/10:hover,
            .admin-main a.border-black\\/10:hover {
              background-color: rgba(198, 165, 107, 0.14) !important;
            }
          `}</style>
          {children}
        </main>
      </div>
    </div>
  );
}
