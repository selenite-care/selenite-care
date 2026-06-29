import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Avatar from "@/components/ui/Avatar";
import { CrmMobileNav, CrmSidebarNav } from "./CrmNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user || session.user.role !== "CRM") {
    redirect("/login");
  }

  return (
    <div className="bg-page flex min-h-screen">
      <aside className="bg-sidebar-themed text-sidebar-themed hidden w-72 px-6 py-8 md:block">
        <div className="flex flex-col items-start">
          <Avatar
            imageUrl={session.user.image ?? null}
            name={session.user.name ?? null}
            size="md"
          />
          <p className="mt-3 text-sm font-bold text-[#2B2B2B] dark:text-[#F0EDE8]">
            {session.user.name ?? "CRM"}
          </p>
          <span className="mt-2 inline-flex rounded-full bg-[#C6A56B] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2B2B2B]">
            {session.user.role}
          </span>
          <p className="mt-6 text-sm font-medium uppercase text-[var(--muted)]">
            CRM Portal
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--sidebar-text)]">
            Selenite Care
          </h1>
        </div>

        <CrmSidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="bg-sidebar-themed text-sidebar-themed flex items-center justify-between px-6 py-4 md:hidden">
          <p className="text-sm font-medium text-[var(--sidebar-text)]">
            CRM Portal
          </p>
          <CrmMobileNav />
        </div>

        <main className="portal-main bg-page flex-1 px-6 py-8">
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
