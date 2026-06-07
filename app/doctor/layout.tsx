import NextAuth from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";
import { DoctorMobileNav, DoctorSidebarNav } from "./DoctorNav";

const { auth } = NextAuth(authConfig);

export default async function DoctorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session?.user?.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#F8F5F0" }}>
      <aside
        className="hidden w-72 px-6 py-8 md:block"
        style={{ backgroundColor: "#2B2B2B" }}
      >
        <div>
          <p
            className="text-sm font-medium uppercase"
            style={{ color: "#B8A89A" }}
          >
            Doctor Portal
          </p>
          <h1
            className="mt-2 text-xl font-semibold tracking-tight"
            style={{ color: "#F8F5F0" }}
          >
            Selenite Care
          </h1>
        </div>

        <DoctorSidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className="flex items-center justify-between px-6 py-4 md:hidden"
          style={{ backgroundColor: "#2B2B2B" }}
        >
          <p className="text-sm font-medium" style={{ color: "#F8F5F0" }}>
            Doctor Portal
          </p>
          <DoctorMobileNav />
        </div>

        <main
          className="portal-main flex-1 px-6 py-8"
          style={{ backgroundColor: "#F8F5F0" }}
        >
          <style>{`
            .portal-main section.rounded-lg,
            .portal-main article.rounded-lg,
            .portal-main div.rounded-lg.border {
              background-color: #FFFFFF;
              border-color: #D8C7B5;
            }

            .portal-main table thead {
              background-color: #D8C7B5;
              color: #2B2B2B;
            }

            .portal-main table thead th {
              color: #2B2B2B;
            }

            .portal-main table tbody tr {
              transition: background-color 160ms ease, color 160ms ease;
            }

            .portal-main table tbody tr:hover {
              background-color: rgba(198, 165, 107, 0.14);
              color: #2B2B2B;
            }

            .portal-main .bg-foreground {
              background-color: #2B2B2B !important;
              color: #F8F5F0 !important;
            }

            .portal-main .hover\\:bg-foreground\\/85:hover {
              background-color: rgba(43, 43, 43, 0.85) !important;
            }

            .portal-main button.border-black\\/10,
            .portal-main a.border-black\\/10 {
              border-color: #C6A56B !important;
              color: #2B2B2B !important;
            }

            .portal-main button.border-black\\/10:hover,
            .portal-main a.border-black\\/10:hover {
              background-color: rgba(198, 165, 107, 0.14) !important;
            }
          `}</style>
          {children}
        </main>
      </div>
    </div>
  );
}
