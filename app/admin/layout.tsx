import NextAuth from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";
import { AdminMobileNav, AdminSidebarNav } from "./AdminNav";

const { auth } = NextAuth(authConfig);

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex flex-1" style={{ backgroundColor: "#F8F5F0" }}>
      <aside
        className="hidden w-72 px-6 py-8 md:block"
        style={{ backgroundColor: "#2B2B2B" }}
      >
        <div>
          <p
            className="text-sm font-medium uppercase"
            style={{ color: "#B8A89A" }}
          >
            Admin
          </p>
          <h1
            className="mt-2 text-xl font-semibold tracking-tight"
            style={{ color: "#F8F5F0" }}
          >
            Selenite Care
          </h1>
        </div>

        <AdminSidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className="flex items-center justify-between px-6 py-4 md:hidden"
          style={{ backgroundColor: "#2B2B2B" }}
        >
          <p className="text-sm font-medium" style={{ color: "#F8F5F0" }}>
            Admin
          </p>
          <AdminMobileNav />
        </div>

        <main
          className="admin-main flex-1 px-6 py-8 [&_thead]:bg-[#D8C7B5] [&_thead]:text-[#2B2B2B] [&_thead_th]:text-[#2B2B2B] [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[#C6A56B]/10"
          style={{ backgroundColor: "#F8F5F0" }}
        >
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
